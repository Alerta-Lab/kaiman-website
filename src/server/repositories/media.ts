import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { getDb, requireDb } from '../db/client';
import { media } from '../db/schema';
import { getEnv } from '../env';

export type MediaItem = typeof media.$inferSelect;

export type MediaListResult = {
	items: MediaItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

const DEFAULT_PAGE_SIZE = 12;

export async function listMedia(
	options: { query?: string; page?: number; pageSize?: number } = {},
): Promise<MediaListResult> {
	const page = Math.max(1, options.page ?? 1);
	const pageSize = Math.min(48, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE));
	const db = getDb();
	if (!db) {
		return { items: [], total: 0, page, pageSize, totalPages: 0 };
	}

	const query = options.query?.trim();
	const where = query
		? or(ilike(media.filename, `%${query}%`), ilike(media.alt, `%${query}%`))
		: undefined;

	const [totalRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(media)
		.where(where);
	const total = totalRow?.count ?? 0;
	const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

	const items = await db
		.select()
		.from(media)
		.where(where)
		.orderBy(desc(media.createdAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return { items, total, page, pageSize, totalPages };
}

export async function deleteMedia(id: string) {
	const database = requireDb();
	const [item] = await database.select().from(media).where(eq(media.id, id)).limit(1);
	if (!item) return false;
	await del(item.url, { token: getEnv('BLOB_READ_WRITE_TOKEN') }).catch(() => undefined);
	await database.delete(media).where(eq(media.id, id));
	return true;
}
