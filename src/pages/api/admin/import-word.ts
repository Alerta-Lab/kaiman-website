import { del, put } from '@vercel/blob';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { slugify } from '../../../features/posts/post.schema';

const importedPost = z.object({
	title: z.string().min(3).max(120),
	excerpt: z.string().min(20).max(320),
	markdown: z.string().min(20),
	seoTitle: z.string().min(3).max(60),
	seoDescription: z.string().min(20).max(160),
	tags: z.array(z.string().min(2).max(50)).max(8),
});

export const POST: APIRoute = async ({ request }) => {
	const form = await request.formData();
	const document = form.get('document');
	if (!(document instanceof File)) return Response.json({ error: 'Documento requerido.' }, { status: 400 });
	if (!/\.docx?$/i.test(document.name) || document.size > 20 * 1024 * 1024) {
		return Response.json({ error: 'Usa un archivo .doc o .docx de hasta 20 MB.' }, { status: 400 });
	}
	if (!import.meta.env.OPENAI_API_KEY || !import.meta.env.BLOB_READ_WRITE_TOKEN) {
		return Response.json({ error: 'OpenAI o Vercel Blob no están configurados.' }, { status: 503 });
	}

	const blob = await put(`imports/${crypto.randomUUID()}-${document.name}`, document, {
		access: 'private',
		token: import.meta.env.BLOB_READ_WRITE_TOKEN,
	});
	const client = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY });
	let openAIFileId: string | undefined;
	try {
		const uploaded = await client.files.create({ file: document, purpose: 'user_data' });
		openAIFileId = uploaded.id;
		const response = await client.responses.parse({
			model: import.meta.env.OPENAI_MODEL ?? 'gpt-4o-mini',
			store: false,
			input: [{
				role: 'user',
				content: [
					{ type: 'input_file', file_id: uploaded.id },
					{ type: 'input_text', text: 'Convierte este documento en un artículo en español. Conserva hechos y estructura, usa Markdown semántico, no inventes datos y propone etiquetas breves.' },
				],
			}],
			text: { format: zodTextFormat(importedPost, 'blog_post') },
		});
		if (!response.output_parsed) throw new Error('El modelo no devolvió un borrador válido.');
		return Response.json({ ...response.output_parsed, slug: slugify(response.output_parsed.title), status: 'draft' });
	} catch (error) {
		return Response.json({ error: error instanceof Error ? error.message : 'Error al analizar el documento.' }, { status: 502 });
	} finally {
		if (openAIFileId) await client.files.delete(openAIFileId).catch(() => undefined);
		await del(blob.url, { token: import.meta.env.BLOB_READ_WRITE_TOKEN }).catch(() => undefined);
	}
};
