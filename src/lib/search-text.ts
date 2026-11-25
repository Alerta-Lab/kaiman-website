/** Match Spanish and English text without case or accent differences. */
export function normalizeSearchText(value: string) {
	return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function searchLikePattern(value: string) {
	return `%${normalizeSearchText(value).replace(/[\\%_]/g, '\\$&')}%`;
}
