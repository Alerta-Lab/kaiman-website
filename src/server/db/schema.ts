import { index, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const postStatus = pgEnum('post_status', ['draft', 'published']);
export const contentLocale = pgEnum('content_locale', ['es', 'en']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name').notNull().default('Administrador'),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex('sessions_token_hash_idx').on(table.tokenHash), index('sessions_user_idx').on(table.userId)],
);

/** Business sector of an article (one per translation group). Tags describe its topics. */
export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	nameEn: text('name_en'),
	slug: text('slug').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const posts = pgTable(
	'posts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
		locale: contentLocale('locale').notNull().default('es'),
		translationGroupId: uuid('translation_group_id').notNull(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		excerpt: text('excerpt').notNull(),
		markdown: text('markdown').notNull(),
		status: postStatus('status').notNull().default('draft'),
		seoTitle: text('seo_title').notNull(),
		seoDescription: text('seo_description').notNull(),
		coverUrl: text('cover_url'),
		coverAlt: text('cover_alt'),
		categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
		editorial: jsonb('editorial').$type<{ coverCaption: string; coverPrompt: string; bodyAlt: string; bodyCaption: string; bodyPrompt: string; approvedAt: string | null; bodyImageUrl: string | null }>(),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex('posts_locale_slug_idx').on(table.locale, table.slug),
		uniqueIndex('posts_group_locale_idx').on(table.translationGroupId, table.locale),
		index('posts_status_published_idx').on(table.status, table.publishedAt),
		index('posts_translation_group_idx').on(table.translationGroupId),
		index('posts_category_idx').on(table.categoryId),
	],
);

export const tags = pgTable('tags', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	nameEn: text('name_en'),
	slug: text('slug').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const postTags = pgTable(
	'post_tags',
	{
		postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
	},
	(table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const media = pgTable('media', {
	id: uuid('id').defaultRandom().primaryKey(),
	url: text('url').notNull(),
	pathname: text('pathname').notNull(),
	filename: text('filename').notNull(),
	mimeType: text('mime_type').notNull(),
	alt: text('alt'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
	action: text('action').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ContentLocale = 'es' | 'en';
