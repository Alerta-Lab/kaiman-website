import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
	const base = site ?? new URL('http://localhost:4321');
	return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${new URL('/sitemap.xml', base)}\n`, {
		headers: { 'Content-Type': 'text/plain' },
	});
};
