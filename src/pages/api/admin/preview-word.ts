import type { APIRoute } from 'astro';
import mammoth from 'mammoth';
import { analyzeWordWithAi } from '../../../server/ai-word-import';
import { classifyPost } from '../../../server/classify-post';
import { listCategories, listTags } from '../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	try {
		const form = await request.formData();
		const file = form.get('document');
		if (!(file instanceof File) || !/\.docx$/i.test(file.name) || file.size === 0 || file.size > 4 * 1024 * 1024) {
			return Response.json({ error: 'Selecciona un archivo .docx de hasta 4 MB.' }, { status: 400 });
		}
		// Mammoth exposes this converter at runtime but omits it from its TypeScript declarations.
		const converter = mammoth as typeof mammoth & { convertToMarkdown(input: { buffer: Buffer }): Promise<{ value: string; messages: { message: string }[] }> };
		const result = await converter.convertToMarkdown({ buffer: Buffer.from(await file.arrayBuffer()) });
		const { topics, excludedBlocks } = await analyzeWordWithAi(result.value);
		let suggestions: (Awaited<ReturnType<typeof classifyPost>> | null)[] = topics.map(() => null);
		try {
			const [categories, tags] = await Promise.all([listCategories(), listTags()]);
			suggestions = await Promise.all(topics.map(async (topic) => {
				const main = topic.versions.find((version) => version.locale === 'es') ?? topic.versions[0];
				const other = topic.versions.find((version) => version !== main);
				try {
					const suggested = await classifyPost({ title: main.title, excerpt: main.excerpt, markdown: main.markdown, otherTitle: other?.title }, categories, tags);
					return { ...suggested, tags: suggested.tags.map((tag) => {
						const existing = tags.find((item) => item.slug === tag.slug);
						return existing ? { ...tag, name: existing.name, nameEn: existing.nameEn ?? tag.nameEn } : tag;
					}) };
				}
				catch { return null; }
			}));
		} catch { /* The preview is still usable if classification is unavailable. */ }
		return Response.json({ topics, suggestions, excludedBlocks, sourceMarkdown: result.value, warnings: result.messages.map((message) => message.message) });
	} catch (error) {
		console.error('[preview-word]', error);
		if (error instanceof Error && error.message === 'OPENAI_NOT_CONFIGURED') return Response.json({ error: 'OpenAI no está configurado. No se analizaron ni guardaron artículos.' }, { status: 503 });
		if (error instanceof Error && error.message === 'DOCUMENT_SIZE') return Response.json({ error: 'El contenido del documento está vacío o supera el límite de análisis. No se guardaron artículos.' }, { status: 422 });
		return Response.json({ error: 'No se pudo analizar el Word con IA de forma segura. Inténtalo de nuevo; no se guardaron artículos.' }, { status: 502 });
	}
};
