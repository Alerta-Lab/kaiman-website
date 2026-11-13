import { describe, expect, it } from 'vitest';
import { blogArticleLanguagePaths } from './blog-paths';

describe('article language links', () => {
	it('links each language to the correct translated slug', () => {
		expect(blogArticleLanguagePaths('es', 'titulo-es', { slug: 'english-title', status: 'published' })).toEqual({ es: '/es/blogs/titulo-es', en: '/en/blogs/english-title' });
		expect(blogArticleLanguagePaths('en', 'english-title', { slug: 'titulo-es', status: 'published' })).toEqual({ es: '/es/blogs/titulo-es', en: '/en/blogs/english-title' });
	});
	it('does not expose draft or missing translations', () => {
		expect(blogArticleLanguagePaths('es', 'titulo-es', { slug: 'draft-en', status: 'draft' }).en).toBe('/en/blogs');
		expect(blogArticleLanguagePaths('en', 'english-title', null).es).toBe('/es/blogs');
	});
});
