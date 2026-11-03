import type { Locale } from '../i18n';

/** Locale-prefixed public blog paths (no trailing slash). */
export function blogIndexPath(locale: Locale) {
	return `/${locale}/blogs`;
}

export function blogPostPath(locale: Locale, slug: string) {
	return `/${locale}/blogs/${slug}`;
}

export function blogCategoryPath(locale: Locale, slug: string) {
	return `/${locale}/blogs/categoria/${slug}`;
}

export function blogSearchPath(locale: Locale) {
	return `/${locale}/blogs/buscar`;
}

/** Swap locale while keeping the blogs subpath after /{locale}. */
export function swapBlogLocalePath(pathname: string, nextLocale: Locale): string {
	const match = pathname.match(/^\/(es|en)(\/.*)?$/);
	if (!match) return blogIndexPath(nextLocale);
	const rest = match[2] ?? '/';
	if (rest === '/' || rest === '') return `/${nextLocale}/`;
	return `/${nextLocale}${rest}`;
}

export function pathWithoutLocale(pathname: string): string {
	const match = pathname.match(/^\/(es|en)(\/.*)?$/);
	if (!match) return pathname;
	return match[2] || '/';
}
