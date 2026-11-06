import { describe, expect, it } from 'vitest';
import { keywordsForSave } from './keyword-save';

describe('keywordsForSave', () => {
	const options = [{ name: 'Fidelización', nameEn: 'Loyalty' }];
	it('includes a new typed keyword when saving without pressing create', () => {
		expect(keywordsForSave(['Ventas'], ' Promociones ', options, 'es')).toEqual(['Ventas', 'Promociones']);
	});
	it('reuses an existing keyword in the article language', () => {
		expect(keywordsForSave([], 'fidelización', options, 'en')).toEqual(['Loyalty']);
		expect(keywordsForSave(['Fidelización'], 'LOYALTY', options, 'es')).toEqual(['Fidelización']);
	});
	it('rejects invalid or excessive pending input instead of losing it', () => {
		expect(() => keywordsForSave([], 'a,b', options, 'es')).toThrow();
		expect(() => keywordsForSave(Array.from({ length: 8 }, (_, i) => `tag${i}`), 'otra', options, 'es')).toThrow();
	});
});
