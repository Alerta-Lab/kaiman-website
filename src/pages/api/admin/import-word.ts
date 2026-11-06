import { del, put } from '@vercel/blob';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { APIRoute } from 'astro';
import { slugify } from '../../../features/posts/post.schema';
import { aiPostSchema } from '../../../server/ai-post';
import { getEnv } from '../../../server/env';

export const POST: APIRoute = async ({ request }) => {
	const form = await request.formData();
	const document = form.get('document');
	const locale = form.get('locale');
	if (locale !== 'es' && locale !== 'en') return Response.json({ error: 'Selecciona un idioma válido.' }, { status: 400 });
	if (!(document instanceof File)) return Response.json({ error: 'Documento requerido.' }, { status: 400 });
	if (!/\.docx?$/i.test(document.name) || document.size > 20 * 1024 * 1024) {
		return Response.json({ error: 'Usa un archivo .doc o .docx de hasta 20 MB.' }, { status: 400 });
	}
	const apiKey = getEnv('OPENAI_API_KEY');
	const blobToken = getEnv('BLOB_READ_WRITE_TOKEN');
	if (!apiKey || !blobToken) {
		return Response.json({ error: 'OpenAI o Vercel Blob no están configurados.' }, { status: 503 });
	}

	const blob = await put(`imports/${crypto.randomUUID()}-${document.name}`, document, {
		access: 'private',
		token: blobToken,
	});
	const client = new OpenAI({ apiKey });
	let openAIFileId: string | undefined;
	try {
		const uploaded = await client.files.create({ file: document, purpose: 'user_data' });
		openAIFileId = uploaded.id;
		const response = await client.responses.parse({
			model: getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini',
			store: false,
			input: [{
				role: 'user',
				content: [
					{ type: 'input_file', file_id: uploaded.id },
					{ type: 'input_text', text: `Convierte este documento en un artículo en ${locale === 'es' ? 'español' : 'inglés'}. Conserva hechos y estructura, usa Markdown semántico, no inventes datos y propone etiquetas breves.` },
				],
			}],
			text: { format: zodTextFormat(aiPostSchema, 'blog_post') },
		});
		if (!response.output_parsed) throw new Error('El modelo no devolvió un borrador válido.');
		return Response.json({ ...response.output_parsed, slug: slugify(response.output_parsed.title), status: 'draft' });
	} catch (error) {
		console.error('[import-word]', error);
		return Response.json({ error: 'No se pudo analizar el documento. Inténtalo de nuevo.' }, { status: 502 });
	} finally {
		if (openAIFileId) await client.files.delete(openAIFileId).catch(() => undefined);
		await del(blob.url, { token: blobToken }).catch(() => undefined);
	}
};
