import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Locale } from '../i18n';

/** Strip Astro `base` (e.g. `/kaiman-website`) so locale parsing sees `/es/...`. */
export function stripBase(pathname: string): string {
	const raw = import.meta.env.BASE_URL || '/';
	if (!raw || raw === '/') return pathname;
	const base = raw.endsWith('/') ? raw.slice(0, -1) : raw;
	if (pathname === base) return '/';
	if (pathname.startsWith(`${base}/`)) {
		const rest = pathname.slice(base.length);
		return rest.length > 0 ? rest : '/';
	}
	return pathname;
}

/** Locale-prefixed public blog paths (no trailing slash). Includes `base` when set. */
export function blogIndexPath(locale: Locale) {
	return getRelativeLocaleUrl(locale, 'blogs').replace(/\/$/, '');
}

export function blogPostPath(locale: Locale, slug: string) {
	return getRelativeLocaleUrl(locale, `blogs/${slug}`).replace(/\/$/, '');
}

export function blogCategoryPath(locale: Locale, slug: string) {
	return getRelativeLocaleUrl(locale, `blogs/categoria/${slug}`).replace(/\/$/, '');
}

export function blogSearchPath(locale: Locale) {
	return getRelativeLocaleUrl(locale, 'blogs/buscar').replace(/\/$/, '');
}

/**
 * Swap locale while keeping the path after `/{locale}`.
 * Accepts pathnames with or without Astro `base`; returns a base-aware URL.
 */
export function swapBlogLocalePath(pathname: string, nextLocale: Locale): string {
	const path = stripBase(pathname);
	const match = path.match(/^\/(es|en)(\/.*)?$/);
	if (!match) return blogIndexPath(nextLocale);
	const rest = match[2] ?? '/';
	if (rest === '/' || rest === '') return getRelativeLocaleUrl(nextLocale, '/');
	return getRelativeLocaleUrl(nextLocale, rest.replace(/^\//, ''));
}

/** Path after locale prefix, without Astro `base` (e.g. `/` or `/blogs/foo`). */
export function pathWithoutLocale(pathname: string): string {
	const path = stripBase(pathname);
	const match = path.match(/^\/(es|en)(\/.*)?$/);
	if (!match) return path || '/';
	return match[2] || '/';
}
