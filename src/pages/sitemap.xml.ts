import type { APIRoute } from 'astro';
import { blogCategoryPath, blogIndexPath, blogPostPath } from '../lib/blog-paths';
import { listPublishedPosts, listTags } from '../server/repositories/posts';

export const prerender = true;

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const GET: APIRoute = async ({ site }) => {
	const [esPosts, enPosts, tags] = await Promise.all([
		listPublishedPosts({ limit: 1000, locale: 'es' }),
		listPublishedPosts({ limit: 1000, locale: 'en' }),
		listTags(),
	]);
	const base = site ?? new URL('http://localhost:4321');
	const urls = [
		{ loc: new URL('/es/', base).toString(), modified: new Date() },
		{ loc: new URL('/en/', base).toString(), modified: new Date() },
		{ loc: new URL(blogIndexPath('es'), base).toString(), modified: new Date() },
		{ loc: new URL(blogIndexPath('en'), base).toString(), modified: new Date() },
		...esPosts.map((post) => ({ loc: new URL(blogPostPath('es', post.slug), base).toString(), modified: post.updatedAt })),
		...enPosts.map((post) => ({ loc: new URL(blogPostPath('en', post.slug), base).toString(), modified: post.updatedAt })),
		...tags.flatMap((tag) => [
			{ loc: new URL(blogCategoryPath('es', tag.slug), base).toString(), modified: tag.createdAt },
			{ loc: new URL(blogCategoryPath('en', tag.slug), base).toString(), modified: tag.createdAt },
		]),
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({ loc, modified }) => `<url><loc>${escape(loc)}</loc><lastmod>${modified.toISOString()}</lastmod></url>`).join('')}</urlset>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600' } });
};
