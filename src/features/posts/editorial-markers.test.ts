import { describe, expect, it } from 'vitest';
import { cleanEditorialMarkdown } from './editorial-markers';

describe('editorial markers', () => {
	it('removes production labels while preserving content and localizing FAQ', () => {
		const source = '__SECTION 1 — KEY POINTS:__\n\n- Consejo útil\n\n__STAT HIGHLIGHT:__\n\nUn dato.\n\n__FAQ:__\n\n__Q1: ¿Cómo funciona?__\n\nRespuesta.';
		const result = cleanEditorialMarkdown(source, 'es');
		expect(result).not.toContain('KEY POINTS');
		expect(result).not.toContain('STAT HIGHLIGHT');
		expect(result).toContain('- Consejo útil');
		expect(result).toContain('Un dato.');
		expect(result).toContain('## Preguntas frecuentes');
		expect(result).toContain('__Q1: ¿Cómo funciona?__');
		expect(cleanEditorialMarkdown('__FAQ:__', 'en')).toBe('## Frequently asked questions');
	});
	it('preserves ordinary headings and fenced examples, then resumes cleanup', () => {
		const source = '__Una sección real:__\n\n```md\n\n__STAT HIGHLIGHT:__\n\n```\n\n__STAT HIGHLIGHT:__\n\nTexto';
		const result = cleanEditorialMarkdown(source, 'es');
		expect(result).toContain('__Una sección real:__');
		expect(result.match(/STAT HIGHLIGHT/g)).toHaveLength(1);
		expect(result).toContain('Texto');
	});
	it('hides standalone language markers without removing article headings or content', () => {
		const spanish = cleanEditorialMarkdown('### VERSIÓN EN ESPAÑOL\n\nTexto del artículo.\n\n## Una sección real', 'es');
		expect(spanish).not.toContain('VERSIÓN EN ESPAÑOL');
		expect(spanish).toContain('Texto del artículo.');
		expect(spanish).toContain('## Una sección real');
		expect(cleanEditorialMarkdown('### ENGLISH VERSION\n\nArticle text.', 'en')).toContain('Article text.');
		expect(cleanEditorialMarkdown('### ENGLISH VERSION\n\nArticle text.', 'en')).not.toContain('ENGLISH VERSION');
	});
});
