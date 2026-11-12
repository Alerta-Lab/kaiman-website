/** Shared media for every locale. Labels come from the dictionaries. */

import { asset } from '../lib/asset';

export type GalleryOrientation = 'portrait' | 'landscape' | 'square';

type GalleryBase = {
	kind: 'image' | 'video';
	src: string;
	tool: 'image' | 'video';
	altKey: 'imageAlt' | 'sweetAlt' | 'videoAlt';
};

const mediaPool: GalleryBase[] = [
	{
		kind: 'image',
		src: asset('/hero/output-1.jpg'),
		tool: 'image',
		altKey: 'imageAlt',
	},
	{
		kind: 'image',
		src: asset('/hero/output-2.png'),
		tool: 'image',
		altKey: 'sweetAlt',
	},
	{
		kind: 'image',
		src: asset('/hero/output-3.jpg'),
		tool: 'image',
		altKey: 'imageAlt',
	},
	{
		kind: 'video',
		src: asset('/video/demo-es.mp4'),
		tool: 'video',
		altKey: 'videoAlt',
	},
];

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

export const galleryItems = orientations.map((orientation, index) => {
	const media = mediaPool[index % mediaPool.length]!;
	return {
		id: `salsana-${index + 1}`,
		orientation,
		...media,
	};
});
