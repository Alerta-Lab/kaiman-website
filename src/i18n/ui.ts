import type { Locale } from './config';
import { landing as en } from './locales/en/landing';
import { landing as es, type LandingCopy } from './locales/es/landing';

const copy: Record<Locale, LandingCopy> = {
	es: es as unknown as LandingCopy,
	en: en as unknown as LandingCopy,
};

export function getLanding(locale: Locale): LandingCopy {
	return copy[locale];
}
