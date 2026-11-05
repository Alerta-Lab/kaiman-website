import type { Locale } from './config';
import { landing as en } from './locales/en/landing';
import { wireframe as enWireframe } from './locales/en/wireframe';
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

export function getLanding(locale: Locale): LandingCopy {
	return copy[locale];
}

export function getWireframe(locale: Locale): WireframeCopy {
	return wireframes[locale];
}
