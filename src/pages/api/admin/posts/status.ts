import type { APIRoute } from 'astro';
import { z } from 'zod';
import { setPostsStatus } from '../../../../server/repositories/posts';

const bodySchema = z.object({ ids: z.array(z.uuid()).min(1).max(200), status: z.enum(['draft', 'published']) });

/** Bulk publish / unpublish from the article list. */
export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	const parsed = bodySchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return Response.json({ error: 'Selecciona al menos un artículo válido.' }, { status: 400 });
	try {
		return Response.json(await setPostsStatus([...new Set(parsed.data.ids)], parsed.data.status));
	} catch (error) {
		console.error('[posts-status]', error);
		return Response.json({ error: 'No se pudo cambiar el estado. Inténtalo de nuevo.' }, { status: 500 });
	}
};
