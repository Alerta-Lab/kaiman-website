import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { postInputSchema } from '../features/posts/post.schema';
import { posts } from './db/schema';
import { requireDb } from './db/client';

export const importVersionSchema = postInputSchema.extend({
	coverCaption: z.string().max(2000), coverPrompt: z.string().max(12000),
	bodyAlt: z.string().max(500), bodyCaption: z.string().max(2000), bodyPrompt: z.string().max(12000),
});
export const importTopicSchema = z.object({
	versions: z.array(importVersionSchema).min(1).max(2),
}).superRefine((topic, context) => {
	if (new Set(topic.versions.map((v) => v.locale)).size !== topic.versions.length) {
		context.addIssue({ code: 'custom', message: 'Hay dos versiones del mismo idioma.' });
	}
});

export async function saveImportedTopic(input: unknown, authorId: string) {
	const topic = importTopicSchema.parse(input);
	const group = randomUUID();
	return requireDb().transaction(async (db) => {
		const created = [];
		for (const v of topic.versions) {
			const [post] = await db.insert(posts).values({
				authorId, translationGroupId: group, locale: v.locale, title: v.title, slug: v.slug,
				excerpt: v.excerpt, markdown: v.markdown, seoTitle: v.seoTitle, seoDescription: v.seoDescription,
				status: 'draft', coverAlt: v.coverAlt || null,
				editorial: { coverCaption: v.coverCaption, coverPrompt: v.coverPrompt, bodyAlt: v.bodyAlt,
					bodyCaption: v.bodyCaption, bodyPrompt: v.bodyPrompt, approvedAt: null, bodyImageUrl: null },
			}).returning();
			created.push({ id: post.id, locale: post.locale });
		}
		return { translationGroupId: group, created };
	});
}
