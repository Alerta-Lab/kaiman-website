import { describe, expect, it } from 'vitest';
import { postInputSchema, slugify } from './post.schema';

describe('post schema', () => {
	it('normaliza slugs en español', () => {
		expect(slugify('  Diseño e IA: Guía rápida  ')).toBe('diseno-e-ia-guia-rapida');
	});

	it('acepta un artículo completo', () => {
		expect(postInputSchema.parse({
			title: 'Diseño con intención',
			slug: 'diseno-con-intencion',
			excerpt: 'Una descripción suficientemente larga para el artículo.',
			markdown: '## Título\n\nContenido suficientemente largo para publicar.',
			status: 'draft',
			seoTitle: 'Diseño con intención',
			seoDescription: 'Una descripción SEO suficientemente larga para explicar el contenido.',
			tags: ['Diseño'],
		}).status).toBe('draft');
	});
});
