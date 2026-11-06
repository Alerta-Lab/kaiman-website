import { describe, expect, it } from 'vitest';
import mammoth from 'mammoth';
import { parseWordMarkdown } from './word-import';
import { importTopicSchema } from '../../server/import-posts';

const path = process.env.TEST_WORD_PATH;
describe.skipIf(!path)('Word editorial real', () => {
	it('separa los cinco temas bilingües y produce datos válidos para guardarlos', async () => {
		const converter = mammoth as typeof mammoth & { convertToMarkdown(input: { path: string }): Promise<{ value: string }> };
		const doc = await converter.convertToMarkdown({ path: path! });
		const topics = parseWordMarkdown(doc.value);
		expect(topics).toHaveLength(5);
		for (const topic of topics) {
			expect(topic.versions.map((v) => v.locale).sort()).toEqual(['en', 'es']);
			expect(importTopicSchema.safeParse(topic).success).toBe(true);
			for (const version of topic.versions) {
				expect(version.markdown).toContain('[IMAGEN_INTERIOR]');
				expect(version.bodyPrompt).not.toBe('');
				expect(version.markdown).not.toContain(version.bodyPrompt);
			}
		}
	});
});
