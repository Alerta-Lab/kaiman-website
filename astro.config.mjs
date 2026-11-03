// @ts-check
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
	output: 'server',
	adapter: vercel(),
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
		checkOrigin: true,
	},
});
