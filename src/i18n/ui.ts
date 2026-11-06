import type { Locale } from './config';
import { admin as enAdmin } from './locales/en/admin';
import { landing as en } from './locales/en/landing';
import { wireframe as enWireframe } from './locales/en/wireframe';
import { admin as esAdmin, type AdminCopy } from './locales/es/admin';
import { landing as es, type LandingCopy } from './locales/es/landing';
import { wireframe as esWireframe } from './locales/es/wireframe';
import type { WireframeCopy } from './locales/en/wireframe';

const copy: Record<Locale, LandingCopy> = {
	es: es as unknown as LandingCopy,
	en: en as unknown as LandingCopy,
};

const wireframes: Record<Locale, WireframeCopy> = {
	es: esWireframe,
	en: enWireframe,
};

const admins: Record<Locale, AdminCopy> = {
	es: esAdmin,
	en: enAdmin,
};

export function getLanding(locale: Locale): LandingCopy {
	return copy[locale];
}

export function getWireframe(locale: Locale): WireframeCopy {
	return wireframes[locale];
}

export function getAdmin(locale: Locale): AdminCopy {
	return admins[locale];
}

export function fillAdmin(template: string, values: Record<string, string | number>) {
	return Object.entries(values).reduce(
		(text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
		template,
	);
}
