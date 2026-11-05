import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Locale } from '../i18n';

/** Locale-prefixed path that includes Astro `base` (GitHub project Pages). */
export function localeUrl(locale: Locale, path = '/'): string {
	return getRelativeLocaleUrl(locale, path);
}
