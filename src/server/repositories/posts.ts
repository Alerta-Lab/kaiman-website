import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { postInputSchema, slugify } from '../../features/posts/post.schema';
import { getDb, requireDb } from '../db/client';
import { postTags, posts, tags, type ContentLocale, type Post, type Tag } from '../db/schema';

export type PostWithTags = Post & { tags: Tag[] };

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
	publishedAt: new Date(),
	createdAt: new Date(),
	updatedAt: new Date(),
	tags: [{ id: 'demo-tag', name: 'Diseño', nameEn: 'Design', slug: 'diseno', createdAt: new Date() }],
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
	if (!db || rows.length === 0) return rows.map((post) => ({ ...post, tags: [] }));
	const links = await db
		.select({ postId: postTags.postId, tag: tags })
		.from(postTags)
		.innerJoin(tags, eq(tags.id, postTags.tagId))
		.where(inArray(postTags.postId, rows.map((post) => post.id)));
	return rows.map((post) => ({ ...post, tags: links.filter((link) => link.postId === post.id).map((link) => link.tag) }));
}

export function tagDisplayName(tag: Tag, locale: ContentLocale) {
	if (locale === 'en' && tag.nameEn) return tag.nameEn;
	return tag.name;
}

export async function listPublishedPosts(
	options: { tag?: string; query?: string; limit?: number; locale?: ContentLocale } = {},
) {
	const locale = options.locale ?? 'es';
	const db = getDb();
	if (!db) {
		const demo = locale === 'en' ? demoPostEn : demoPost;
		const matchesTag = !options.tag || demo.tags.some((tag) => tag.slug === options.tag);
		const q = options.query?.toLowerCase();
		const matchesQuery = !q || `${demo.title} ${demo.excerpt}`.toLowerCase().includes(q);
		return matchesTag && matchesQuery ? [demo] : [];
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

export async function listAllPosts() {
	const db = getDb();
	if (!db) return [demoPost, demoPostEn];
	return attachTags(await db.select().from(posts).orderBy(desc(posts.updatedAt)));
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
	const translationGroupId = existing?.translationGroupId ?? randomUUID();
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
	};
	const [post] = id
		? await database.update(posts).set(values).where(eq(posts.id, id)).returning()
		: await database.insert(posts).values(values).returning();
	if (!post) throw new Error('No se pudo guardar el artículo.');

	await database.delete(postTags).where(eq(postTags.postId, post.id));
	for (const name of [...new Set(data.tags)]) {
		const slug = slugify(name);
		const [tag] = await database
			.insert(tags)
			.values({ name, slug })
			.onConflictDoUpdate({ target: tags.slug, set: { name } })
			.returning();
		await database.insert(postTags).values({ postId: post.id, tagId: tag.id }).onConflictDoNothing();
	}
	return post;
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
	const sibling = await getSiblingPost(source.translationGroupId, targetLocale);
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
		authorId,
		translationGroupId: source.translationGroupId,
		updatedAt: new Date(),
		publishedAt: null,
	};

	const [post] = sibling
		? await database.update(posts).set(values).where(eq(posts.id, sibling.id)).returning()
		: await database.insert(posts).values(values).returning();
	if (!post) throw new Error('No se pudo guardar la traducción.');

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
}

export async function deletePost(id: string) {
	await requireDb().delete(posts).where(eq(posts.id, id));
}

export async function saveTag(name: string, id?: string) {
	const value = name.trim();
	if (value.length < 2) throw new Error('La etiqueta debe tener al menos 2 caracteres.');
	const database = requireDb();
	if (id) return database.update(tags).set({ name: value, slug: slugify(value) }).where(eq(tags.id, id)).returning();
	return database.insert(tags).values({ name: value, slug: slugify(value) }).returning();
}

export async function deleteTag(id: string) {
	await requireDb().delete(tags).where(eq(tags.id, id));
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
