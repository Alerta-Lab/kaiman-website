import { desc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { media } from '../db/schema';

export async function listMedia() {
	const db = getDb();
	if (!db) return [];
	return db.select().from(media).orderBy(desc(media.createdAt)).limit(100);
}
