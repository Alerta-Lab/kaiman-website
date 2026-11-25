import { sql, type SQLWrapper } from 'drizzle-orm';
import { searchLikePattern } from '../lib/search-text';

/** Uses PostgreSQL Unicode normalization; no unaccent extension or migration. */
export function accentInsensitiveLike(column: SQLWrapper, query: string) {
	return sql<boolean>`regexp_replace(lower(normalize(${column}, NFD)), ${'[\u0300-\u036f]'}, '', 'g') like ${searchLikePattern(query)} escape ${'\\'}`;
}
