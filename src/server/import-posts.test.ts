import { describe, expect, it } from 'vitest';
import { importTopicSchema } from './import-posts';
import { imagePrompts } from './blog-images';
import type { Post } from './db/schema';

const version = { title: 'Un artículo', slug: 'un-articulo', excerpt: 'Descripción suficientemente larga.', markdown: 'Contenido suficientemente largo para el artículo.', seoTitle: 'Título SEO', seoDescription: 'Descripción SEO suficientemente larga.', locale: 'es' as const, coverAlt: '', coverCaption: '', coverPrompt: '', bodyAlt: '', bodyCaption: '', bodyPrompt: '' };

describe('validación del flujo editorial', () => {
	it('admite una o dos versiones y rechaza idiomas duplicados', () => {
		expect(importTopicSchema.safeParse({ versions: [version] }).success).toBe(true);
		expect(importTopicSchema.safeParse({ versions: [version, { ...version, locale: 'en' }] }).success).toBe(true);
		expect(importTopicSchema.safeParse({ versions: [version, version] }).success).toBe(false);
	});
	it('no permite crear prompts de imagen antes de aceptar el contenido', () => {
		const post = { title: 'Restaurante', status: 'draft', coverAlt: 'Menú', editorial: { approvedAt: null, coverPrompt: 'Portada', bodyAlt: 'Cocina', bodyPrompt: 'Interior' } } as unknown as Post;
		expect(() => imagePrompts(post)).toThrow();
		const accepted = { ...post, editorial: { ...post.editorial!, approvedAt: '2026-01-01T00:00:00.000Z' } };
		expect(imagePrompts(accepted)[0]).toContain('Menú');
		expect(imagePrompts(accepted)[1]).toContain('Interior');
	});
});
