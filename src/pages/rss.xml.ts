import type { APIRoute } from 'astro';
import { blogPostPath } from '../lib/blog-paths';
import { listPublishedPosts } from '../server/repositories/posts';

const escape = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const GET: APIRoute = async ({ site }) => {
	const [esPosts, enPosts] = await Promise.all([
		listPublishedPosts({ limit: 50, locale: 'es' }),
		listPublishedPosts({ limit: 50, locale: 'en' }),
	]);
	const posts = [...esPosts, ...enPosts].sort(
		(a, b) => (b.publishedAt ?? b.createdAt).getTime() - (a.publishedAt ?? a.createdAt).getTime(),
	);
	const base = site ?? new URL('http://localhost:4321');
	const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Kaiman Blog</title><link>${base}</link><description>Diseño, tecnología e inteligencia artificial.</description>${posts
		.map(
			(post) =>
				`<item><title>${escape(post.title)}</title><link>${new URL(blogPostPath(post.locale, post.slug), base)}</link><guid>${post.id}</guid><description>${escape(post.excerpt)}</description><pubDate>${(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate></item>`,
		)
		.join('')}</channel></rss>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml', 'Cache-Control': 'public, s-maxage=3600' } });
};
