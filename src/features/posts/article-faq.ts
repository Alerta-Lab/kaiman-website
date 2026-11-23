import { cleanEditorialMarkdown, closingCtaPart, editorialLabel } from './editorial-markers';
import type { ImportLocale } from './word-import';
import { renderMarkdown } from '../../lib/markdown';
import { signupUrl } from '../../lib/plans';

const ctaMarker = (block: string, part: 'hook-line' | 'headline') => {
	return closingCtaPart(block) === part || block.trim() === `<!-- kaiman:cta-${part} -->`;
};

const faqQuestion = (block: string) => /^(?:Q|P|Pregunta|Question)\s*\d*\s*:\s*(.+)$/i.exec(editorialLabel(block));
const answerText = (block: string) => block
	.replace(/^(?:__|\*\*)(?:A|R|Respuesta|Answer)\s*:\s*(?:__|\*\*)\s*/i, '')
	.replace(/^((?:__|\*\*)?)(?:A|R|Respuesta|Answer)\s*:\s*/i, '$1');
const faqBoundary = (block: string) => !!faqQuestion(block) || !!closingCtaPart(block) || /^<!--\s*kaiman:cta-/.test(block.trim()) || /^#{1,6}\s/.test(block) || /^SECTION\s+\d+\b/i.test(editorialLabel(block));

/** Render numbered or unnumbered Q/A entries without consuming the following section. */
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
		if (/^(?:preguntas frecuentes|frequently asked questions|faq)$/i.test(editorialLabel(block))) {
			inFaq = true;
			ordinary.push(block);
			continue;
		}
		if (inFaq && !faqQuestion(block) && faqBoundary(block)) inFaq = false;
		const question = inFaq && faqQuestion(block);
		const answer = blocks[i + 1];
		if (!question || !answer || faqBoundary(answer)) {
			ordinary.push(block);
			continue;
		}
		await flush();
		const escapedQuestion = question[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		const answers = [answerText(answer)];
		let end = i + 2;
		let answerFence = (answer.match(/^\s*(?:`{3,}|~{3,})/gm) ?? []).length % 2 === 1;
		while (end < blocks.length) {
			const next = blocks[end];
			if (!answerFence && faqBoundary(next)) break;
			answers.push(next);
			if ((next.match(/^\s*(?:`{3,}|~{3,})/gm) ?? []).length % 2) answerFence = !answerFence;
			end++;
		}
		const answerHtml = await renderMarkdown(answers.join('\n\n'));
		chunks.push(`<details class="article-faq"><summary>${escapedQuestion}<span aria-hidden="true">+</span></summary><div>${answerHtml}</div></details>`);
		i = end - 1;
	}
	await flush();
	return chunks.join('\n');
}
