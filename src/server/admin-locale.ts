import type { AstroCookies } from 'astro';
import type { ContentLocale } from './db/schema';

const COOKIE_NAME = 'kaiman_admin_locale';
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getAdminLocale(cookies: AstroCookies): ContentLocale {
	return cookies.get(COOKIE_NAME)?.value === 'en' ? 'en' : 'es';
}

export function setAdminLocale(cookies: AstroCookies, locale: ContentLocale) {
	cookies.set(COOKIE_NAME, locale, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		path: '/',
		maxAge: YEAR_SECONDS,
	});
}

export function parseContentLocale(value: FormDataEntryValue | string | null | undefined): ContentLocale | null {
	return value === 'es' || value === 'en' ? value : null;
}
