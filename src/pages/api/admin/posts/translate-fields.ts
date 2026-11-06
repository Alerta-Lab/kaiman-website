import type { APIRoute } from 'astro';
import { z } from 'zod';
import { translateFields } from '../../../../server/translate-post';

const bodySchema = z.object({
	sourceLocale: z.enum(['es', 'en']),
	targetLocale: z.enum(['es', 'en']),
	title: z.string().trim().min(3),
	excerpt: z.string().trim().min(20),
	markdown: z.string().trim().min(20),
	seoTitle: z.string().trim().min(3),
	seoDescription: z.string().trim().min(20),
	coverAlt: z.string().trim().max(160).optional().nullable(),
	tags: z.array(z.string().trim().min(2).max(50)).max(8).default([]),
});

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) {
		return Response.json({ error: 'No autorizado' }, { status: 401 });
	}

	try {
		const body = bodySchema.parse(await request.json());
		if (body.sourceLocale === body.targetLocale) {
			return Response.json({ error: 'El idioma de origen y destino deben ser distintos.' }, { status: 400 });
		}

		const translated = await translateFields(
			{
				locale: body.sourceLocale,
				title: body.title,
				excerpt: body.excerpt,
				markdown: body.markdown,
				seoTitle: body.seoTitle,
				seoDescription: body.seoDescription,
				coverAlt: body.coverAlt,
				tags: body.tags,
			},
			body.targetLocale,
		);

		return Response.json({ ok: true, translated });
	} catch (error) {
		console.error('[translate-fields]', error);
		if (error instanceof z.ZodError) {
			return Response.json(
				{ error: 'El idioma de origen no tiene contenido suficiente para traducir.', detail: error.flatten() },
				{ status: 400 },
			);
		}
		return Response.json(
			{ error: 'No se pudo traducir. Comprueba OPENAI_API_KEY e inténtalo de nuevo.' },
			{ status: 500 },
		);
	}
};
