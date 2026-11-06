import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { postInputSchema, slugify } from '../../features/posts/post.schema';
import { getDb, requireDb } from '../db/client';
import type { Classification } from '../classify-post';
import { categories, postTags, posts, tags, type Category, type ContentLocale, type Post, type Tag } from '../db/schema';

export type PostWithTags = Post & { tags: Tag[]; category: Category | null };
type Tx = Parameters<Parameters<ReturnType<typeof requireDb>['transaction']>[0]>[0];

const demoPost: PostWithTags = {
	id: 'demo',
	authorId: null,
	locale: 'es',
	translationGroupId: 'demo-group',
	slug: 'disena-productos-digitales-con-intencion',
	title: 'Diseña productos digitales con intención',
	excerpt: 'Una guía práctica para convertir una idea en una experiencia clara, accesible y memorable.',
	markdown: `## Menos ruido, más intención\n\nUn buen producto digital conecta una necesidad real con una solución simple.`,
	status: 'published',
	seoTitle: 'Diseña productos digitales con intención',
	seoDescription: 'Principios prácticos para crear experiencias digitales claras, accesibles y efectivas.',
	coverUrl: null,
	coverAlt: null,
	categoryId: null,
	editorial: null,
	publishedAt: new Date(),
	createdAt: new Date(),
	updatedAt: new Date(),
	tags: [{ id: 'demo-tag', name: 'Diseño', nameEn: 'Design', slug: 'diseno', createdAt: new Date() }],
	category: null,
};

const demoPostEn: PostWithTags = {
	...demoPost,
	id: 'demo-en',
	locale: 'en',
	title: 'Design digital products with intention',
	excerpt: 'A practical guide to turn an idea into a clear, accessible, and memorable experience.',
	markdown: `## Less noise, more intention\n\nA good digital product connects a real need with a simple solution.`,
	seoTitle: 'Design digital products with intention',
	seoDescription: 'Practical principles for clear, accessible, and effective digital experiences.',
	tags: demoPost.tags,
};

async function attachTags(rows: Post[]): Promise<PostWithTags[]> {
	const db = getDb();
	if (!db || rows.length === 0) return rows.map((post) => ({ ...post, tags: [], category: null }));
	const categoryIds = [...new Set(rows.map((post) => post.categoryId).filter((id): id is string => Boolean(id)))];
	const [links, rowCategories] = await Promise.all([
		db
			.select({ postId: postTags.postId, tag: tags })
			.from(postTags)
			.innerJoin(tags, eq(tags.id, postTags.tagId))
			.where(inArray(postTags.postId, rows.map((post) => post.id))),
		categoryIds.length ? db.select().from(categories).where(inArray(categories.id, categoryIds)) : Promise.resolve([] as Category[]),
	]);
	return rows.map((post) => ({
		...post,
		tags: links.filter((link) => link.postId === post.id).map((link) => link.tag),
		category: rowCategories.find((category) => category.id === post.categoryId) ?? null,
	}));
}

/** Works for tags and categories: both store the Spanish name in `name` and the English one in `nameEn`. */
export function tagDisplayName(tag: Pick<Tag, 'name' | 'nameEn'>, locale: ContentLocale) {
	const name = (locale === 'en' && tag.nameEn ? tag.nameEn : tag.name).trim();
	return name ? name[0].toLocaleUpperCase(locale) + name.slice(1) : name;
}

export const categoryDisplayName = tagDisplayName;

export async function listPublishedPosts(
	options: { tag?: string; category?: string; query?: string; limit?: number; locale?: ContentLocale } = {},
) {
	const locale = options.locale ?? 'es';
	const db = getDb();
	if (!db) {
		const demo = locale === 'en' ? demoPostEn : demoPost;
		const matchesTag = !options.tag || demo.tags.some((tag) => tag.slug === options.tag);
		const q = options.query?.toLowerCase();
		const matchesQuery = !q || `${demo.title} ${demo.excerpt}`.toLowerCase().includes(q);
		return matchesTag && matchesQuery && !options.category ? [demo] : [];
	}
	const filters = [eq(posts.status, 'published'), eq(posts.locale, locale)];
	if (options.query) {
		filters.push(or(ilike(posts.title, `%${options.query}%`), ilike(posts.excerpt, `%${options.query}%`))!);
	}
	if (options.tag) {
		const tagged = await db
			.select({ postId: postTags.postId })
			.from(postTags)
			.innerJoin(tags, eq(tags.id, postTags.tagId))
			.where(eq(tags.slug, options.tag));
		if (!tagged.length) return [];
		filters.push(inArray(posts.id, tagged.map(({ postId }) => postId)));
	}
	if (options.category) {
		const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, options.category)).limit(1);
		if (!category) return [];
		filters.push(eq(posts.categoryId, category.id));
	}
	const rows = await db
		.select()
		.from(posts)
		.where(and(...filters))
		.orderBy(desc(posts.publishedAt))
		.limit(options.limit ?? 24);
	return attachTags(rows);
}

export async function getPublishedPost(slug: string, locale: ContentLocale = 'es') {
	const db = getDb();
	if (!db) {
		const demo = locale === 'en' ? demoPostEn : demoPost;
		return slug === demo.slug ? demo : null;
	}
	const [post] = await db
		.select()
		.from(posts)
		.where(and(eq(posts.slug, slug), eq(posts.locale, locale), eq(posts.status, 'published')))
		.limit(1);
	return post ? (await attachTags([post]))[0] : null;
}

export async function getSiblingPost(translationGroupId: string, locale: ContentLocale) {
	const db = getDb();
	if (!db) {
		if (translationGroupId !== 'demo-group') return null;
		return locale === 'en' ? demoPostEn : demoPost;
	}
	const [post] = await db
		.select()
		.from(posts)
		.where(and(eq(posts.translationGroupId, translationGroupId), eq(posts.locale, locale)))
		.limit(1);
	return post ? (await attachTags([post]))[0] : null;
}

export async function getPostById(id: string) {
	const db = getDb();
	if (!db) return id === 'demo' ? demoPost : id === 'demo-en' ? demoPostEn : null;
	const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	return post ? (await attachTags([post]))[0] : null;
}

export type AdminPostListResult = {
	items: PostWithTags[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export async function listAllPosts(
	options: { query?: string; page?: number; pageSize?: number } = {},
): Promise<AdminPostListResult> {
	const page = Math.max(1, options.page ?? 1);
	const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10));
	const query = options.query?.trim();
	const db = getDb();

	if (!db) {
		const demo = [demoPost, demoPostEn].filter((post) => {
			if (!query) return true;
			const haystack = `${post.title} ${post.excerpt} ${post.slug}`.toLowerCase();
			return haystack.includes(query.toLowerCase());
		});
		const total = demo.length;
		const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
		const start = (page - 1) * pageSize;
		return { items: demo.slice(start, start + pageSize), total, page, pageSize, totalPages };
	}

	const where = query
		? or(ilike(posts.title, `%${query}%`), ilike(posts.slug, `%${query}%`), ilike(posts.excerpt, `%${query}%`))
		: undefined;

	const [totalRow] = await db.select({ count: sql<number>`count(*)::int` }).from(posts).where(where);
	const total = totalRow?.count ?? 0;
	const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
	const rows = await db
		.select()
		.from(posts)
		.where(where)
		.orderBy(desc(posts.updatedAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return { items: await attachTags(rows), total, page, pageSize, totalPages };
}

export async function listTags() {
	const db = getDb();
	if (!db) return demoPost.tags;
	return db.select().from(tags).orderBy(tags.name);
}

export async function savePost(input: unknown, authorId: string, id?: string) {
	const data = postInputSchema.parse(input);
	const database = requireDb();
	const existing = id ? await getPostById(id) : null;
	if (data.status === 'published' && (data.coverUrl?.startsWith('/blog-generated/') || existing?.editorial?.bodyImageUrl?.startsWith('/blog-generated/'))) throw new Error('Las imágenes locales deben subirse a almacenamiento persistente antes de publicar.');
	const translationGroupId =
		existing?.translationGroupId ?? data.translationGroupId ?? randomUUID();
	const values = {
		title: data.title,
		slug: data.slug,
		excerpt: data.excerpt,
		markdown: data.markdown,
		status: data.status,
		locale: data.locale,
		seoTitle: data.seoTitle,
		seoDescription: data.seoDescription,
		coverUrl: data.coverUrl || null,
		coverAlt: data.coverAlt || null,
		authorId,
		translationGroupId,
		updatedAt: new Date(),
		publishedAt: data.status === 'published' ? existing?.publishedAt ?? new Date() : null,
		...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
		...(existing?.editorial ? { editorial: { ...existing.editorial, ...data.editorial, approvedAt: null } } : {}),
	};
	return database.transaction(async (database) => {
	const [post] = id
		? await database.update(posts).set(values).where(eq(posts.id, id)).returning()
		: await database.insert(posts).values(values).returning();
	if (!post) throw new Error('No se pudo guardar el artículo.');
	// The category is the business sector: shared by every language version of the article.
	if (data.categoryId !== undefined) {
		await database.update(posts).set({ categoryId: data.categoryId }).where(eq(posts.translationGroupId, post.translationGroupId));
	}
	await linkTagsByName(database, post.id, data.tags, data.locale);
	return post;
	});
}

/** Link tags typed in the editor, matching existing ones in the editor's language so ES/EN keep one shared tag. */
async function linkTagsByName(database: Tx, postId: string, names: string[], locale: ContentLocale) {
	await database.delete(postTags).where(eq(postTags.postId, postId));
	const nameColumn = locale === 'en' ? tags.nameEn : tags.name;
	for (const name of [...new Set(names.map((value) => value.trim()).filter(Boolean))]) {
		const slug = slugify(name);
		if (!slug) throw new Error('Una palabra clave no contiene caracteres válidos para su URL.');
		let [tag] = await database
			.select()
			.from(tags)
			.where(or(sql`lower(${nameColumn}) = lower(${name})`, eq(tags.slug, slug)))
			.limit(1);
		if (!tag) {
			[tag] = await database.insert(tags).values(locale === 'en' ? { name, nameEn: name, slug } : { name, slug }).onConflictDoNothing().returning();
			tag ??= (await database.select().from(tags).where(eq(tags.slug, slug)).limit(1))[0];
		}
		if (tag) await database.insert(postTags).values({ postId, tagId: tag.id }).onConflictDoNothing();
	}
}

export async function upsertTranslationDraft(
	source: PostWithTags,
	targetLocale: ContentLocale,
	translated: {
		title: string;
		excerpt: string;
		markdown: string;
		seoTitle: string;
		seoDescription: string;
		coverAlt?: string | null;
		tags: string[];
	},
	authorId: string,
) {
	const database = requireDb();
	const values = {
		title: translated.title,
		slug: source.slug,
		excerpt: translated.excerpt,
		markdown: translated.markdown,
		status: 'draft' as const,
		locale: targetLocale,
		seoTitle: translated.seoTitle,
		seoDescription: translated.seoDescription,
		coverUrl: source.coverUrl,
		coverAlt: translated.coverAlt ?? source.coverAlt,
		categoryId: source.categoryId,
		editorial: source.editorial ? { ...source.editorial, bodyAlt: '', bodyCaption: '', approvedAt: null } : null,
		authorId,
		translationGroupId: source.translationGroupId,
		updatedAt: new Date(),
		publishedAt: null,
	};

	return database.transaction(async (database) => {
	const [post] = await database.insert(posts).values(values).onConflictDoNothing().returning();
	if (!post) throw new Error('Ya existe una traducción o el slug está en uso. No se modificó ningún artículo.');

	await database.delete(postTags).where(eq(postTags.postId, post.id));
	// Keep source tag slugs so /es/blogs/categoria/x and /en/blogs/categoria/x stay paired.
	for (let index = 0; index < source.tags.length; index += 1) {
		const sourceTag = source.tags[index];
		const translatedName = translated.tags[index] ?? translated.tags[0] ?? sourceTag.name;
		const [tag] = await database
			.insert(tags)
			.values({
				name: targetLocale === 'es' ? translatedName : sourceTag.name,
				nameEn: targetLocale === 'en' ? translatedName : sourceTag.nameEn,
				slug: sourceTag.slug,
			})
			.onConflictDoUpdate({
				target: tags.slug,
				set:
					targetLocale === 'en'
						? { nameEn: translatedName }
						: { name: translatedName },
			})
			.returning();
		await database.insert(postTags).values({ postId: post.id, tagId: tag.id }).onConflictDoNothing();
	}
	return post;
	});
}

/**
 * Publish or unpublish several articles at once. Applies the same rule as the editor: articles whose images
 * still live only in /blog-generated/ are skipped. Republishing keeps the original publication date.
 */
export async function setPostsStatus(ids: string[], status: 'draft' | 'published') {
	const database = requireDb();
	const rows = await database.select().from(posts).where(inArray(posts.id, ids));
	const skipped: { id: string; title: string; reason: string }[] = [];
	let updated = 0;
	for (const post of rows) {
		if (post.status === status) continue;
		if (status === 'published' && (post.coverUrl?.startsWith('/blog-generated/') || post.editorial?.bodyImageUrl?.startsWith('/blog-generated/'))) {
			skipped.push({ id: post.id, title: post.title, reason: 'sus imágenes solo están en local; súbelas a Blob desde el editor' });
			continue;
		}
		await database
			.update(posts)
			.set({ status, publishedAt: status === 'published' ? post.publishedAt ?? new Date() : null, updatedAt: new Date() })
			.where(eq(posts.id, post.id));
		updated++;
	}
	return { updated, skipped, unchanged: rows.length - updated - skipped.length, missing: ids.length - rows.length };
}

export async function deletePost(id: string) {
	await requireDb().delete(posts).where(eq(posts.id, id));
}

export async function saveTag(input: { name: string; nameEn?: string | null }, id?: string) {
	const name = input.name.trim();
	const nameEnRaw = input.nameEn?.trim() ?? '';
	const nameEn = nameEnRaw.length > 0 ? nameEnRaw : null;
	if (name.length < 2) throw new Error('La etiqueta en español debe tener al menos 2 caracteres.');
	if (nameEn && nameEn.length < 2) throw new Error('La etiqueta en inglés debe tener al menos 2 caracteres.');
	const database = requireDb();
	const values = { name, nameEn, slug: slugify(name) };
	if (id) return database.update(tags).set(values).where(eq(tags.id, id)).returning();
	return database.insert(tags).values(values).returning();
}

export async function deleteTag(id: string) {
	await requireDb().delete(tags).where(eq(tags.id, id));
}

export async function listCategories(): Promise<Category[]> {
	const db = getDb();
	if (!db) return [];
	return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
	const db = getDb();
	if (!db) return null;
	const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
	return category ?? null;
}

/** Categories with at least one published article in the locale, for public navigation and the sitemap. */
export async function listPublishedCategories(locale: ContentLocale) {
	const db = getDb();
	if (!db) return [] as Category[];
	return db
		.selectDistinct({ id: categories.id, name: categories.name, nameEn: categories.nameEn, slug: categories.slug, createdAt: categories.createdAt })
		.from(categories)
		.innerJoin(posts, and(eq(posts.categoryId, categories.id), eq(posts.status, 'published'), eq(posts.locale, locale)))
		.orderBy(categories.name);
}

export async function listCategoriesWithCounts() {
	const db = getDb();
	if (!db) return [] as (Category & { posts: number })[];
	return db
		.select({ id: categories.id, name: categories.name, nameEn: categories.nameEn, slug: categories.slug, createdAt: categories.createdAt, posts: sql<number>`count(${posts.id})::int` })
		.from(categories)
		.leftJoin(posts, eq(posts.categoryId, categories.id))
		.groupBy(categories.id)
		.orderBy(categories.name);
}

export async function saveCategory(input: { name: string; nameEn: string }, id?: string) {
	const name = input.name.trim();
	const nameEn = input.nameEn.trim() || null;
	if (name.length < 2) throw new Error('La categoría debe tener al menos 2 caracteres.');
	const database = requireDb();
	// Renaming keeps the slug so public URLs stay stable.
	if (id) return database.update(categories).set({ name, nameEn }).where(eq(categories.id, id)).returning();
	return database.insert(categories).values({ name, nameEn, slug: slugify(name) }).onConflictDoNothing().returning();
}

export async function deleteCategory(id: string) {
	await requireDb().delete(categories).where(eq(categories.id, id));
}

/** Store an AI classification on every language version of an article: one category, shared tags. */
export async function applyClassification(translationGroupId: string, classification: Classification) {
	return requireDb().transaction(async (database) => {
		const { category: suggested } = classification;
		let categoryCreated = false;
		let [category] = await database.select().from(categories).where(eq(categories.slug, suggested.slug)).limit(1);
		if (!category) {
			[category] = await database.insert(categories).values({ name: suggested.name, nameEn: suggested.nameEn, slug: suggested.slug }).onConflictDoNothing().returning();
			categoryCreated = Boolean(category);
			category ??= (await database.select().from(categories).where(eq(categories.slug, suggested.slug)).limit(1))[0];
		}
		const group = await database.update(posts).set({ categoryId: category.id }).where(eq(posts.translationGroupId, translationGroupId)).returning({ id: posts.id });
		const tagIds: string[] = [];
		for (const suggestedTag of classification.tags) {
			let [tag] = await database.select().from(tags).where(eq(tags.slug, suggestedTag.slug)).limit(1);
			if (!tag) {
				[tag] = await database.insert(tags).values({ name: suggestedTag.name, nameEn: suggestedTag.nameEn, slug: suggestedTag.slug }).onConflictDoNothing().returning();
				tag ??= (await database.select().from(tags).where(eq(tags.slug, suggestedTag.slug)).limit(1))[0];
			} else if (!tag.nameEn) {
				await database.update(tags).set({ nameEn: suggestedTag.nameEn }).where(eq(tags.id, tag.id));
			}
			if (tag) tagIds.push(tag.id);
		}
		for (const post of group) {
			await database.delete(postTags).where(eq(postTags.postId, post.id));
			if (tagIds.length) await database.insert(postTags).values(tagIds.map((tagId) => ({ postId: post.id, tagId }))).onConflictDoNothing();
		}
		return { category, tagCount: tagIds.length, posts: group.length, categoryCreated };
	});
}

export async function dashboardCounts() {
	const db = getDb();
	if (!db) return { posts: 2, drafts: 0, published: 2, tags: 1 };
	const [result] = await db
		.select({
			posts: sql<number>`count(*)::int`,
			drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
			published: sql<number>`count(*) filter (where ${posts.status} = 'published')::int`,
		})
		.from(posts);
	const [tagCount] = await db.select({ count: sql<number>`count(*)::int` }).from(tags);
	return { ...result, tags: tagCount.count };
}
