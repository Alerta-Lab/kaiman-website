import { z } from 'zod';

export const slugify = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export const postInputSchema = z.object({
	title: z.string().trim().min(3).max(120),
	slug: z.string().trim().min(3).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	excerpt: z.string().trim().min(20).max(320),
	markdown: z.string().trim().min(20),
	status: z.enum(['draft', 'published']).default('draft'),
	locale: z.enum(['es', 'en']).default('es'),
	seoTitle: z.string().trim().min(3).max(60),
	seoDescription: z.string().trim().min(20).max(160),
	coverUrl: z.url().or(z.literal('')).optional(),
	coverAlt: z.string().trim().max(160).optional(),
	tags: z.array(z.string().trim().min(2).max(50)).max(8).default([]),
});

export type PostInput = z.infer<typeof postInputSchema>;
