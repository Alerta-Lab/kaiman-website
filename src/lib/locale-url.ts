import type { Locale } from '../i18n';

/** Astro `base` with trailing slash (e.g. `/kaiman-website/` or `/`). */
export function siteBase(): string {
	const raw = import.meta.env.BASE_URL || '/';
	return raw.endsWith('/') ? raw : `${raw}/`;
}

/**
 * Locale-prefixed public URL that always includes `/{locale}/…` and Astro `base`.
 *
 * Do not use `getRelativeLocaleUrl` for these routes: with the default
 * `prefixDefaultLocale: false`, the default locale (`es`) is omitted, but pages
 * live under `src/pages/[locale]/` so Spanish links must keep `/es/`.
 */
export function localeUrl(locale: Locale, path = '/'): string {
	const base = siteBase();
	const clean =
		path === '/' || path === '' ? '' : path.replace(/^\/+/, '').replace(/\/$/, '');
	return clean ? `${base}${locale}/${clean}` : `${base}${locale}/`;
}
