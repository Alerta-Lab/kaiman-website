import { describe, expect, it, vi } from 'vitest';
vi.mock('./env', () => ({ getEnv: () => undefined }));
import { resolveClassification } from './classify-post';

const base = [
	{ name: 'Restaurantes', nameEn: 'Restaurants', slug: 'restaurantes' },
	{ name: 'Med spas y estética', nameEn: 'Med spas & aesthetics', slug: 'med-spas-y-estetica' },
];
const tags = [{ name: 'membresías', nameEn: 'memberships' }, { name: 'fidelización', nameEn: 'loyalty' }];

describe('clasificación de categoría y etiquetas', () => {
	it('reutiliza una categoría existente por slug o por nombre', () => {
		expect(resolveClassification({ category: { slug: 'restaurantes', name: 'Restaurantes', nameEn: 'Restaurants' }, tags }, base).category).toMatchObject({ slug: 'restaurantes', isNew: false });
		expect(resolveClassification({ category: { slug: null, name: 'Med spas y Estética', nameEn: 'Medical spas' }, tags }, base).category).toMatchObject({ slug: 'med-spas-y-estetica', isNew: false });
		expect(resolveClassification({ category: { slug: 'inventado', name: 'Otra', nameEn: 'Restaurants' }, tags }, base).category.slug).toBe('restaurantes');
	});
	it('crea una categoría nueva si ninguna encaja', () => {
		const result = resolveClassification({ category: { slug: null, name: 'Gimnasios', nameEn: 'Gyms' }, tags }, base);
		expect(result.category).toEqual({ slug: 'gimnasios', name: 'Gimnasios', nameEn: 'Gyms', isNew: true });
	});
	it('deduplica etiquetas, descarta la que repite la categoría y limita a seis', () => {
		const many = [{ name: 'Restaurantes', nameEn: 'Restaurants' }, ...tags, { name: 'Membresías', nameEn: 'Memberships' }, ...['a1', 'b2', 'c3', 'd4', 'e5'].map((name) => ({ name, nameEn: name }))];
		const result = resolveClassification({ category: { slug: 'restaurantes', name: 'Restaurantes', nameEn: 'Restaurants' }, tags: many }, base);
		expect(result.tags.map((tag) => tag.slug)).toEqual(['membresias', 'fidelizacion', 'a1', 'b2', 'c3', 'd4']);
	});
	it('rechaza respuestas mal formadas', () => {
		expect(() => resolveClassification({ category: { name: '' }, tags: [] }, base)).toThrow();
	});
});
