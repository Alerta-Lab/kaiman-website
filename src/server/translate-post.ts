import OpenAI from 'openai';
import { z } from 'zod';
import { getEnv } from './env';
import type { ContentLocale } from './db/schema';
import type { PostWithTags } from './repositories/posts';

const translatedSchema = z.object({
	title: z.string().min(3).max(120),
	excerpt: z.string().min(20).max(320),
	markdown: z.string().min(20),
	seoTitle: z.string().min(3).max(60),
	seoDescription: z.string().min(20).max(160),
	coverAlt: z.string().max(160).nullable().optional(),
	tags: z.array(z.string().min(2).max(50)).max(8),
});

const localeLabel: Record<ContentLocale, string> = {
	es: 'Spanish',
	en: 'English',
};

export async function translatePostContent(source: PostWithTags, targetLocale: ContentLocale) {
	const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
	if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no está configurada.');

	const client = new OpenAI({ apiKey: OPENAI_API_KEY });
	const response = await client.chat.completions.create({
		model: 'gpt-4o-mini',
		temperature: 0.2,
		response_format: { type: 'json_object' },
		messages: [
			{
				role: 'system',
				content:
					'You translate Kaiman Studio blog posts. Keep Markdown structure, headings, links, code fences and the exact placeholder [IMAGEN_INTERIOR] intact. Return only JSON with keys: title, excerpt, markdown, seoTitle, seoDescription, coverAlt, tags (array of short tag names in the target language). Preserve brand names Kaiman and Kaiman Studio. Do not invent facts.',
			},
			{
				role: 'user',
				content: JSON.stringify({
					targetLocale: localeLabel[targetLocale],
					sourceLocale: localeLabel[source.locale],
					title: source.title,
					excerpt: source.excerpt,
					markdown: source.markdown,
					seoTitle: source.seoTitle,
					seoDescription: source.seoDescription,
					coverAlt: source.coverAlt,
					tags: source.tags.map((tag) => tag.name),
				}),
			},
		],
	});

	const raw = response.choices[0]?.message?.content;
	if (!raw) throw new Error('La traducción no devolvió contenido.');
	return translatedSchema.parse(JSON.parse(raw));
}
