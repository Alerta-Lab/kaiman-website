import { describe, expect, it } from 'vitest';
import { cleanMetadataValue } from './metadata-values';
import { postInputSchema } from './post.schema';

describe('editorial metadata values', () => {
	it('removes inline field labels with Word emphasis and preserves the full value', () => {
		for (const title of ['META TITLE: Gobierno de marca', 'META TITLE:\n\nGobierno de marca', '**META TITLE:** Gobierno de marca', '__META TITLE: Gobierno de marca__', '**META TITLE**: Gobierno de marca']) {
			expect(cleanMetadataValue(title, 'seoTitle')).toBe('Gobierno de marca');
		}
		expect(cleanMetadataValue('META DESCRIPTION: Una descripción: con todo el contenido.', 'seoDescription')).toBe('Una descripción: con todo el contenido.');
	});
	it('preserves ordinary titles, inner colons and labels for unrelated fields', () => {
		expect(cleanMetadataValue('Guía: cómo elegir un meta title', 'seoTitle')).toBe('Guía: cómo elegir un meta title');
		expect(cleanMetadataValue('META TITLE: Ejemplo', 'bodyPrompt')).toBe('META TITLE: Ejemplo');
	});
	it('normalizes metadata when saving an article and rejects label-only values', () => {
		const input = { title: 'Un artículo', slug: 'un-articulo', excerpt: 'Un resumen suficientemente largo.', markdown: 'El contenido del artículo original.', seoTitle: 'META TITLE: Un título SEO', seoDescription: 'META DESCRIPTION: Una descripción suficientemente larga.' };
		expect(postInputSchema.parse(input).seoTitle).toBe('Un título SEO');
		expect(postInputSchema.safeParse({ ...input, seoTitle: 'META TITLE:' }).success).toBe(false);
	});
});
