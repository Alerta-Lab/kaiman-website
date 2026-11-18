import type { APIRoute } from 'astro';
import { productionSiteOrigin } from '../lib/site-origin.mjs';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
	const base = site ?? productionSiteOrigin;
	return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${new URL('/sitemap.xml', base)}\n`, {
		headers: { 'Content-Type': 'text/plain' },
	});
};
