import { describe, expect, it } from 'vitest';
import { parseWordMarkdown } from './word-import';

const version = (language: string, slug: string) => `## ${language} VERSION\n\n__TITLE__\n\nTítulo de prueba\n\n__SLUG__\n\n${slug}\n\n__META TITLE__\n\nTítulo SEO\n\n__META DESCRIPTION__\n\nDescripción suficientemente larga para la página.\n\n__LEDE__\n\nUna introducción que describe el artículo.\n\n__INTRODUCTION__\n\nPárrafo original.\n\n__SECTION 1 — Ideas__\n\n* Primera idea\n* Segunda idea\n\n__IN-ARTICLE IMAGE — PROMPT__\n\nUna imagen privada\n\n__IN-ARTICLE IMAGE — ALT TEXT__\n\nDescripción accesible\n\n__FAQ__\n\nQ: ¿Qué es?\n\nA: Una prueba.`;

describe('importación estructurada de Word', () => {
	it('separa temas e idiomas y conserva slugs, listas y prompts privados', () => {
		const topics = parseWordMarkdown(`# TOPIC 1 — Tema\n\n${version('ENGLISH', 'english\\-slug')}\n\n${version('SPANISH / ESPAÑOL', 'slug\\-es')}\n\n# TOPIC 2 — Otro\n\n${version('SPANISH', 'otro')}`);
		expect(topics).toHaveLength(2);
		expect(topics[0].versions.map((v) => v.locale)).toEqual(['en', 'es']);
		expect(topics[0].versions[0].slug).toBe('english-slug');
		expect(topics[0].versions[0].markdown).toContain('* Primera idea');
		expect(topics[0].versions[0].markdown).not.toContain('Una imagen privada');
		expect(topics[0].versions[0].bodyPrompt).toBe('Una imagen privada');
		expect(topics[1].versions.map((v) => v.locale)).toEqual(['es']);
	});
	it('marca errores y datos incompletos sin recortar textos', () => {
		const long = 'a'.repeat(90);
		const [topic] = parseWordMarkdown(`# TOPIC 1\n\n## ENGLISH VERSION\n\n__META TITLE__\n\n${long}`);
		expect(topic.versions[0].seoTitle).toBe(long);
		expect(topic.versions[0].warnings).not.toContain('Título SEO supera 60 caracteres.');
		expect(topic.versions[0].warnings).toContain('Falta título.');
	});
});
