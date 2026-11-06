import { eq } from 'drizzle-orm';
import { classifyPost } from './classify-post';
import { requireDb } from './db/client';
import { posts } from './db/schema';
import { applyClassification, listCategories, listTags } from './repositories/posts';

/**
 * Ask the AI for the category and tags of an article and store them on all its language versions.
 * Uses the Spanish version as the source when there is one. Consumes OpenAI credits (gpt-4o-mini).
 */
export async function classifyTranslationGroup(translationGroupId: string) {
	const group = await requireDb().select().from(posts).where(eq(posts.translationGroupId, translationGroupId));
	if (!group.length) throw new Error('Artículo no encontrado.');
	const main = group.find((post) => post.locale === 'es') ?? group[0];
	const other = group.find((post) => post.id !== main.id);
	const [existingCategories, existingTags] = await Promise.all([listCategories(), listTags()]);
	const classification = await classifyPost(
		{ title: main.title, excerpt: main.excerpt, markdown: main.markdown, otherTitle: other?.title },
		existingCategories,
		existingTags,
	);
	const applied = await applyClassification(translationGroupId, classification);
	return {
		category: { name: applied.category.name, nameEn: applied.category.nameEn, slug: applied.category.slug, created: applied.categoryCreated },
		tags: classification.tags.map(({ name, nameEn }) => ({ name, nameEn })),
	};
}
