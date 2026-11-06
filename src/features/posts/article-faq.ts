import { cleanEditorialMarkdown } from './editorial-markers';
import type { ImportLocale } from './word-import';
import { renderMarkdown } from '../../lib/markdown';
import { signupUrl } from '../../lib/plans';

const ctaMarker = (block: string, part: 'hook-line' | 'headline') => {
	const original = part === 'hook-line' ? 'HOOK LINE' : 'HEADLINE';
	return new RegExp(`^(?:(?:__|\\*\\*)CLOSING CTA\\s*[—–-]\\s*${original}\\s*:(?:__|\\*\\*)|<!--\\s*kaiman:cta-${part}\\s*-->)$`, 'i').test(block.trim());
};

/** Render explicitly numbered questions under an FAQ heading as native disclosures. */
export async function renderArticleMarkdown(markdown: string, locale: ImportLocale) {
	const blocks = markdown.replace(/\r\n/g, '\n').split(/\n\s*\n/);
	const chunks: string[] = [];
	let ordinary: string[] = [];
	let inFaq = false;
	let inFence = false;
	const flush = async () => {
		if (ordinary.length) chunks.push(await renderMarkdown(cleanEditorialMarkdown(ordinary.join('\n\n'), locale)));
		ordinary = [];
	};
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const fenceCount = (block.match(/^\s*(?:`{3,}|~{3,})/gm) ?? []).length;
		if (inFence || fenceCount) {
			ordinary.push(block);
			if (fenceCount % 2) inFence = !inFence;
			continue;
		}
		if (ctaMarker(block, 'hook-line') && blocks[i + 1] && blocks[i + 2] && ctaMarker(blocks[i + 2], 'headline') && blocks[i + 3]) {
			await flush();
			const hook = await renderMarkdown(blocks[i + 1]);
			const headline = await renderMarkdown(blocks[i + 3]);
			const button = locale === 'es' ? 'Crear cuenta en Kaiman' : 'Create a Kaiman account';
			chunks.push(`<aside class="article-cta"><div class="article-cta-headline">${headline}</div><div class="article-cta-hook">${hook}</div><a href="${signupUrl}">${button}</a></aside>`);
			i += 3;
			inFaq = false;
			continue;
		}
		if (/^(?:__|\*\*)FAQ\s*:?(?:__|\*\*)\s*$/i.test(block.trim()) || /^#{1,6}\s+(?:preguntas frecuentes|frequently asked questions|faq)\s*:?\s*$/i.test(block.trim())) {
			inFaq = true;
			ordinary.push(block);
			continue;
		}
		if (inFaq && (/^#{1,6}\s/.test(block) || /^(?:__|\*\*)CLOSING CTA\b/i.test(block))) inFaq = false;
		const question = inFaq && /^(?:__|\*\*)\s*(?:Q|P|Pregunta|Question)\s*\d+\s*:\s*(.+?)(?:__|\*\*)\s*$/i.exec(block.trim());
		const answer = blocks[i + 1];
		if (!question || !answer || /^(?:__|\*\*)\s*(?:(?:Q|P|Pregunta|Question)\s*\d+\s*:|CLOSING CTA\b)/i.test(answer.trim()) || /^#{1,6}\s/.test(answer)) {
			ordinary.push(block);
			continue;
		}
		await flush();
		const escapedQuestion = question[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		const answerHtml = await renderMarkdown(answer);
		chunks.push(`<details class="article-faq"><summary>${escapedQuestion}<span aria-hidden="true">+</span></summary><div>${answerHtml}</div></details>`);
		i++;
	}
	await flush();
	return chunks.join('\n');
}
