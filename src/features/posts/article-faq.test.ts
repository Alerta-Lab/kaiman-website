import { describe, expect, it } from 'vitest';
import { renderArticleMarkdown } from './article-faq';

describe('article FAQ', () => {
	it('renders numbered FAQ entries as disclosures without swallowing the CTA', async () => {
		const html = await renderArticleMarkdown('__FAQ:__\n\n__Q1: ¿Cómo funciona?__\n\nLa primera respuesta.\n\n__Q2: ¿Cuánto cuesta?__\n\nLa segunda respuesta.\n\n__CLOSING CTA — HOOK LINE:__\n\nEl cierre.', 'es');
		expect(html.match(/<details/g)).toHaveLength(2);
		expect(html).toContain('<summary>¿Cómo funciona?');
		expect(html).toContain('La primera respuesta.');
		expect(html.indexOf('El cierre.')).toBeGreaterThan(html.lastIndexOf('</details>'));
		expect(html).not.toContain('CLOSING CTA');
	});
	it('leaves non-FAQ numbered questions and code examples alone', async () => {
		const html = await renderArticleMarkdown('__Q1: Normal?__\n\nText.\n\n```\n__FAQ:__\n\n__Q1: Sample?__\n\nExample\n```', 'en');
		expect(html).not.toContain('<details');
		expect(html).toContain('Normal?');
		expect(html).toContain('Sample?');
	});
	it('renders a complete closing CTA as a card with the article text', async () => {
		for (const markers of [['__CLOSING CTA — HOOK LINE:__', '__CLOSING CTA — HEADLINE:__'], ['<!-- kaiman:cta-hook-line -->', '<!-- kaiman:cta-headline -->']]) {
			const html = await renderArticleMarkdown(`${markers[0]}\n\n*Una invitación.*\n\n${markers[1]}\n\n**Tu siguiente paso**`, 'es');
			expect(html).toContain('class="article-cta"');
			expect(html).toContain('Una invitación.');
			expect(html).toContain('Tu siguiente paso');
			expect(html).toContain('https://app.kaimanstudio.ai/auth/register');
		}
	});
});
