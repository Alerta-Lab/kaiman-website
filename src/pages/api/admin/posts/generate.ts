import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { slugify } from '../../../../features/posts/post.schema';
import { aiPostSchema } from '../../../../server/ai-post';
import { getEnv } from '../../../../server/env';
import { savePost } from '../../../../server/repositories/posts';

const inputSchema = z.object({
	brief: z.string().trim().min(10).max(4000),
	locale: z.enum(['es', 'en']),
});

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	let input: z.infer<typeof inputSchema>;
	try {
		input = inputSchema.parse(await request.json());
	} catch {
		return Response.json({ error: 'Escribe instrucciones de entre 10 y 4000 caracteres y selecciona un idioma.' }, { status: 400 });
	}
	const apiKey = getEnv('OPENAI_API_KEY');
	if (!apiKey) return Response.json({ error: 'OpenAI no está configurado.' }, { status: 503 });
	try {
		const client = new OpenAI({ apiKey });
		const response = await client.responses.parse({
			model: getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini',
			store: false,
			instructions: 'Escribe un borrador de blog para Kaiman Studio. No inventes datos, cifras, testimonios ni fuentes. Usa Markdown semántico. Respeta los límites del esquema y usa el idioma solicitado. El contenido será revisado antes de publicarse.',
			input: JSON.stringify(input),
			text: { format: zodTextFormat(aiPostSchema, 'blog_post') },
		});
		if (!response.output_parsed) throw new Error('Respuesta vacía');
		const generated = response.output_parsed;
		const baseSlug = slugify(generated.title).slice(0, 120).replace(/-$/, '');
		const post = await savePost({ ...generated, slug: `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`, locale: input.locale, status: 'draft' }, locals.admin.id);
		return Response.json({ id: post.id }, { status: 201 });
	} catch (error) {
		console.error('[generate-post]', error);
		return Response.json({ error: 'No se pudo generar y guardar el borrador. Inténtalo de nuevo.' }, { status: 502 });
	}
};
