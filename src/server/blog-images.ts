import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import { del, put } from '@vercel/blob';
import { and, eq } from 'drizzle-orm';
import { media, posts, type Post } from './db/schema';
import { requireDb } from './db/client';
import { getEnv } from './env';
import type { ImageProgressEvent } from '../features/posts/image-progress';

type BodyAspect = '9:16' | '3:2';

/**
 * Kaiman house style, distilled from the hero/body images of the published kaimanstudio.ai blog
 * (med spas, nail salons, agencies, law firms, realtors). See docs/direccion-imagenes-blog.md.
 * The Word brief only feeds the concept: it is interpreted, never reproduced literally.
 */
export const IMAGE_HOUSE_STYLE = [
	'KAIMAN HOUSE STYLE — always applies and overrides anything in the article concept:',
	'- Foreground: the business owner or professional of the sector seen over the shoulder from behind (face mostly hidden), working with a stylus on a tablet, or on a laptop, at a counter or desk with a few props of the trade.',
	'- Midground: 4 to 7 large floating translucent frosted-glass cards, white and lilac with glowing violet and blue edges, linked by thin glowing lines and arrows into a clear marketing flow that illustrates the article idea. Each card holds a realistic photo from the sector (clients, products, results) and one rounded icon badge in a corner, chosen to match the idea: calendar, envelope, chat bubble, camera, heart, star, gift, crown, bell, rising bar chart, check mark or shield. A small friendly white robot assistant icon may act as the central hub.',
	'- Background: a real, recognizable, premium business of the sector, softly out of focus.',
	'- Light and color: warm golden-hour or early-evening ambience (amber shelf lights, candles or a sunset through the windows) blended with the violet and blue glow of the cards. Vibrant, well exposed and crisp, like polished commercial photography. Never gloomy, murky or underexposed.',
	'- The device screen shows a clean app interface made only of photos, icons and simple rounded color bars.',
	'- NO TEXT: no letters, words, numbers, dates, prices, labels, signs, brand logos, social network logos or watermarks anywhere: not on cards, screens, signs, packaging or clothing. Wherever an interface would show text, draw plain solid rounded bars instead.',
].join('\n');

const LAYOUT = {
	hero: 'Wide 16:9 landscape hero image. The cards run as a left-to-right flow across the upper two thirds; the person and the device take the left and lower part.',
	'9:16': 'Tall 9:16 portrait interior image. The cards form a connected network stacked in the upper two thirds; the person and the device sit in the lower part.',
	'3:2': 'Horizontal 3:2 interior image. The cards form a connected network around the center; the person and the device take the left and lower part.',
} as const;

export function imagePrompts(post: Post, bodyAspect: BodyAspect = '9:16') {
	if (!post.editorial?.approvedAt || post.status !== 'draft') throw new Error('El contenido debe estar aceptado.');
	const prompt = (layout: string, description: string, brief: string, role: string) => {
		const concept = [
			`Article title: ${post.title}`,
			post.excerpt?.trim() && `Article summary: ${post.excerpt.trim()}`,
			post.markdown?.trim() && `Article context (excerpt): ${post.markdown.trim().slice(0, 6000)}`,
			description.trim() && `Image description: ${description.trim()}`,
			brief.trim() && `Image brief: ${brief.trim()}`,
		].filter(Boolean).join('\n');
		return [
			`${layout} For a Kaiman Studio blog article. ${role}`,
			'',
			'ARTICLE CONCEPT — inspiration only. Use it to pick the business sector, the setting and the marketing idea, then express that idea through the photos inside the cards and their icons. Do not reproduce it literally, and ignore any lighting, mood, color, style or on-screen text it mentions.',
			concept,
			'',
			IMAGE_HOUSE_STYLE,
		].join('\n');
	};
	return [
		prompt(LAYOUT.hero, post.coverAlt ?? '', post.editorial.coverPrompt, 'It opens the article and shows the big idea.'),
		prompt(LAYOUT[bodyAspect], post.editorial.bodyAlt, post.editorial.bodyPrompt, 'It belongs to the same visual family and setting as the hero image of this article and goes deeper into one part of the idea.'),
	] as const;
}

export async function generateBlogImages(post: Post, bodyAspect: BodyAspect = '9:16', onProgress: (event: ImageProgressEvent) => void = () => {}, reviewedPrompts?: readonly [string, string]) {
	const defaults = imagePrompts(post, bodyAspect);
	const prompts = reviewedPrompts ?? defaults;
	const apiKey = getEnv('OPENAI_API_KEY');
	if (!apiKey) throw new Error('OpenAI no está configurado.');
	const blobToken = getEnv('BLOB_READ_WRITE_TOKEN');
	if (!blobToken) throw new Error('Vercel Blob no está configurado.');
	const client = new OpenAI({ apiKey, timeout: 180_000, maxRetries: 0 });
	const files: { url: string; pathname: string; filename: string }[] = [];
	try {
		for (let i = 0; i < 2; i++) {
			const imagePart = i === 0 ? 'cover' : 'body';
			onProgress({ type: 'generating', image: imagePart });
			const prompt = prompts[i];
			const image = await client.images.generate({ model: 'gpt-image-2', prompt, size: i === 0 ? '1536x864' : bodyAspect === '3:2' ? '1536x1024' : '864x1536', quality: 'medium', output_format: 'webp' });
			const data = image.data?.[0]?.b64_json;
			if (!data) throw new Error('No se recibió la imagen.');
			const filename = `${randomUUID()}.webp`;
			onProgress({ type: 'uploading', image: imagePart, percentage: 0 });
			const blob = await put(`blog/${post.translationGroupId}/${filename}`, Buffer.from(data, 'base64'), {
				access: 'public', contentType: 'image/webp', token: blobToken,
				onUploadProgress: ({ percentage }) => onProgress({ type: 'uploading', image: imagePart, percentage: Math.max(0, Math.min(100, Math.round(percentage))) }),
			});
			files.push({ url: blob.url, pathname: blob.pathname, filename });
			onProgress({ type: 'uploaded', image: imagePart });
		}
		const urls = files.map((file) => file.url);
		onProgress({ type: 'saving' });
		const db = requireDb();
		await db.transaction(async (tx) => {
			const siblings = await tx.select().from(posts).where(and(eq(posts.translationGroupId, post.translationGroupId), eq(posts.status, 'draft'))).for('update');
			const current = siblings.find((item) => item.id === post.id);
			if (!current?.editorial?.approvedAt || current.updatedAt.getTime() !== post.updatedAt.getTime()) throw new Error('El artículo cambió durante la generación.');
			await tx.insert(media).values(files.map((file, index) => ({ ...file, mimeType: 'image/webp', alt: index === 0 ? post.coverAlt : post.editorial?.bodyAlt ?? null })));
			for (const sibling of siblings) {
				if (!sibling.editorial) continue;
				await tx.update(posts).set({ coverUrl: urls[0], editorial: { ...sibling.editorial, bodyImageUrl: urls[1] } }).where(eq(posts.id, sibling.id));
			}
		});
		return { coverUrl: urls[0], bodyImageUrl: urls[1] };
	} catch (error) {
		await Promise.all(files.map((file) => del(file.url, { token: blobToken }).catch((cleanupError) => console.error('[blog-images cleanup]', cleanupError))));
		throw error;
	}
}

/** Upload an existing local pair without changing or deleting the original files. */
export async function uploadLocalBlogImages(post: Post) {
	const token = getEnv('BLOB_READ_WRITE_TOKEN');
	if (!token) throw new Error('Vercel Blob no está configurado.');
	const original = [post.coverUrl, post.editorial?.bodyImageUrl];
	if (!original.every((url) => typeof url === 'string' && /^\/blog-generated\/[0-9a-f-]+\.webp$/i.test(url))) throw new Error('El artículo no tiene dos imágenes locales válidas.');
	const files: { url: string; pathname: string; filename: string }[] = [];
	try {
		for (const url of original as string[]) {
			const bytes = await readFile(path.join(process.cwd(), 'public', 'blog-generated', path.basename(url)));
			const filename = `${randomUUID()}.webp`;
			const blob = await put(`blog/${post.translationGroupId}/${filename}`, bytes, { access: 'public', contentType: 'image/webp', token });
			files.push({ url: blob.url, pathname: blob.pathname, filename });
		}
		await requireDb().transaction(async (tx) => {
			const siblings = await tx.select().from(posts).where(and(eq(posts.translationGroupId, post.translationGroupId), eq(posts.status, 'draft'))).for('update');
			const current = siblings.find((item) => item.id === post.id);
			if (!current?.editorial || current.coverUrl !== original[0] || current.editorial.bodyImageUrl !== original[1]) throw new Error('Las imágenes cambiaron durante la subida.');
			await tx.insert(media).values(files.map((file, index) => ({ ...file, mimeType: 'image/webp', alt: index === 0 ? post.coverAlt : post.editorial?.bodyAlt ?? null })));
			for (const sibling of siblings) {
				if (!sibling.editorial || sibling.coverUrl !== original[0] || sibling.editorial.bodyImageUrl !== original[1]) continue;
				await tx.update(posts).set({ coverUrl: files[0].url, editorial: { ...sibling.editorial, bodyImageUrl: files[1].url } }).where(eq(posts.id, sibling.id));
			}
		});
		return { coverUrl: files[0].url, bodyImageUrl: files[1].url };
	} catch (error) {
		await Promise.all(files.map((file) => del(file.url, { token }).catch((cleanupError) => console.error('[blog-images cleanup]', cleanupError))));
		throw error;
	}
}
