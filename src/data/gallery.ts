/** Shared media for every locale. Labels come from the dictionaries. */

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
		src: '/demos/salsana/pieza-2.webp',
		tool: 'image',
		altKey: 'imageAlt',
	},
	{
		kind: 'video',
		src: '/demos/salsana/pieza-1.mp4',
		tool: 'video',
		altKey: 'videoAlt',
	},
	{
		kind: 'image',
		src: '/demos/salsana/pieza-dulce.webp',
		tool: 'image',
		altKey: 'sweetAlt',
	},
	{
		kind: 'video',
		src: '/demos/salsana/pieza-2.mp4',
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
	'landscape',
	'square',
	'portrait',
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
	'landscape',
	'square',
	'portrait',
	'landscape',
	'square',
];

export const galleryItems = orientations.map((orientation, index) => {
	const media = mediaPool[index % mediaPool.length];
	return {
		id: `salsana-${index + 1}`,
		orientation,
		...media,
	};
});
