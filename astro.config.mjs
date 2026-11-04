// @ts-check
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const githubPages = process.env.GITHUB_PAGES === 'true';
const site =
	process.env.PUBLIC_SITE_URL ??
	(githubPages ? 'https://alerta-lab.github.io' : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
	site,
	base: githubPages ? '/kaiman-website/' : undefined,
	output: githubPages ? 'static' : 'server',
	adapter: githubPages ? undefined : vercel(),
	i18n: {
		defaultLocale: 'es',
		locales: ['es', 'en'],
		// Manual: keep /admin and /api outside locale prefixes without i18n middleware 404s.
		routing: 'manual',
	},
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: ['@node-rs/argon2', 'ws', 'bufferutil'],
		},
	},
	security: {
		checkOrigin: !githubPages,
	},
});
