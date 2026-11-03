import { z } from 'zod';

export const aiPostSchema = z.object({
	title: z.string().min(3).max(120),
	excerpt: z.string().min(20).max(320),
	markdown: z.string().min(20),
	seoTitle: z.string().min(3).max(60),
	seoDescription: z.string().min(20).max(160),
	tags: z.array(z.string().min(2).max(50)).max(8),
});
