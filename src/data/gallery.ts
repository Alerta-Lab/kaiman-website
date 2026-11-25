/** Shared media per locale. Labels come from the dictionaries. */

import type { Locale } from '../i18n';
import { asset } from '../lib/asset';

export type GalleryOrientation = 'portrait' | 'landscape' | 'square';

type GalleryBase = {
	kind: 'image' | 'video';
	src: string;
	tool: 'image' | 'video';
	altKey: 'imageAlt' | 'sweetAlt' | 'videoAlt';
};

const heroPaths: Record<Locale, [string, string, string]> = {
	es: ['/hero/es/output-1.jpg', '/hero/es/output-2.png', '/hero/es/output-3.jpg'],
	en: ['/hero/en/output-1.jpg', '/hero/en/output-2.jpg', '/hero/en/output-3.jpg'],
};

function mediaPoolFor(locale: Locale): GalleryBase[] {
	const [a, b, c] = heroPaths[locale];
	return [
		{ kind: 'image', src: asset(a), tool: 'image', altKey: 'imageAlt' },
		{ kind: 'image', src: asset(b), tool: 'image', altKey: 'sweetAlt' },
		{ kind: 'image', src: asset(c), tool: 'image', altKey: 'imageAlt' },
		{
			kind: 'video',
			src: asset(locale === 'en' ? '/video/demo-en.mp4' : '/video/demo-es.mp4'),
			tool: 'video',
			altKey: 'videoAlt',
		},
	];
}

/** Mix of vertical and horizontal tiles for a dense masonry board (~30). */
const orientations: GalleryOrientation[] = [
	'portrait',
	'landscape',
	'square',
	'portrait',
	'landscape',
	'portrait',
	'square',
	'landscape',
	'portrait',
	'square',
	'landscape',
	'portrait',
	'landscape',
	'square',
	'portrait',
	'landscape',
	'portrait',
	'square',
	'landscape',
	'portrait',
	'square',
	'landscape',
	'portrait',
	'landscape',
	'square',
	'portrait',
	'landscape',
	'portrait',
	'square',
	'landscape',
];

export function getGalleryItems(locale: Locale) {
	const mediaPool = mediaPoolFor(locale);
	return orientations.map((orientation, index) => {
		const media = mediaPool[index % mediaPool.length]!;
		return {
			id: `salsana-${index + 1}`,
			orientation,
			...media,
		};
	});
}

/** @deprecated Prefer getGalleryItems(locale) */
export const galleryItems = getGalleryItems('es');
