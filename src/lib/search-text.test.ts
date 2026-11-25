import { describe, expect, it } from 'vitest';
import { normalizeSearchText, searchLikePattern } from './search-text';

describe('blog search normalization', () => {
	it('matches accented, unaccented and decomposed Spanish text', () => {
		for (const title of ['Barbería', 'BARBERÍA', 'Barberi\u0301a']) {
			expect(normalizeSearchText(title)).toBe('barberia');
		}
		expect(normalizeSearchText('  Promoción y fidelización  ')).toBe('promocion y fidelizacion');
	});
	it('treats percent, underscore and backslash as literal search text', () => {
		expect(searchLikePattern('100%_\\')).toBe('%100\\%\\_\\\\%');
	});
});
