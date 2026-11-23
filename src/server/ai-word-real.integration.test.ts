import { describe, expect, it } from 'vitest';
import mammoth from 'mammoth';
import { buildWordPreview, splitWordBlocks } from './ai-word-import';
import { editorialLabel, editorialMarker, editorialMetadataField } from '../features/posts/editorial-markers';
import { renderArticleMarkdown } from '../features/posts/article-faq';

// Opt-in regression against the supplied November Word, without API calls or DB writes.
const path = process.env.TEST_AI_WORD_PATH;
describe.skipIf(!path)('November Word reconstruction and public rendering', () => {
	it('preserves all five bilingual articles, maps image fields and renders thirty FAQs', async () => {
		const converter = mammoth as typeof mammoth & { convertToMarkdown(input: { path: string }): Promise<{ value: string }> };
		const { value } = await converter.convertToMarkdown({ path: path! });
		const blocks = splitWordBlocks(value);
		const topicStarts = blocks.flatMap((block, index) => /^# TOPIC \d+/.test(block) ? [index] : []);
		const structure = { topics: topicStarts.map((start, index) => {
			const end = topicStarts[index + 1] ?? blocks.length;
			const languages = blocks.flatMap((block, i) => i > start && i < end && /^\[(?:ENGLISH|ESPAÑOL)\]$/.test(editorialLabel(block)) ? [i] : []);
			return { label: blocks[start], versions: languages.map((i, j) => ({ locale: editorialLabel(blocks[i]).includes('ENGLISH') ? 'en' as const : 'es' as const, start: i, end: (languages[j + 1] ?? end) - 1 })) };
		}) };
		expect(structure.topics).toHaveLength(5);
		// Deliberately omit AI field assignments: explicit source labels must guard
		// against incomplete/swapped mappings for this layout.
		const result = buildWordPreview(blocks, structure, structure.topics.flatMap(t => t.versions.map(v => ({ fields: [], labels: blocks.slice(v.start, v.end + 1).flatMap((b, i) => /^(?:Q\s*\d*\s*:|\[Kaiman)/i.test(editorialLabel(b)) ? [i] : []) }))));
		for (const [i, topic] of result.topics.entries()) {
			expect(topic.versions.map(v => v.locale)).toEqual(['en', 'es']);
			for (const [j, version] of topic.versions.entries()) {
				expect(version.warnings).toEqual([]);
				expect(version.bodyPrompt).toMatch(/Midjourney/);
				expect(version.bodyAlt).not.toMatch(/Midjourney/);
				expect(version.bodyCaption).not.toMatch(/Midjourney/);
				expect(version.markdown).toContain('[IMAGEN_INTERIOR]');
				expect(version.markdown).not.toMatch(/Midjourney|IN\\?-ARTICLE IMAGE|SECTION \d|__TITLE__|\[ESPAÑOL\]/);
				const part = structure.topics[i].versions[j];
				for (let b = part.start; b <= part.end; b++) {
					if (editorialMarker(blocks[b], version.locale) !== null || (b > part.start && editorialMetadataField(blocks[b - 1]))) continue;
					expect(version.markdown).toContain(blocks[b]);
				}
				const html = await renderArticleMarkdown(version.markdown, version.locale);
				expect(html.match(/<details/g)).toHaveLength(3);
				expect(html).toContain('class="article-cta"');
				expect(html).not.toContain('Midjourney');
			}
		}
	});
});
