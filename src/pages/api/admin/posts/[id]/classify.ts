import type { APIRoute } from 'astro';
import { classifyTranslationGroup } from '../../../../../server/auto-classify';
import { getPostById } from '../../../../../server/repositories/posts';

/** Re-run the AI classification for an article; overwrites the category and tags of all its language versions. */
export const POST: APIRoute = async ({ params, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	const post = await getPostById(params.id ?? '');
	if (!post) return Response.json({ error: 'Artículo no encontrado.' }, { status: 404 });
	try {
		return Response.json(await classifyTranslationGroup(post.translationGroupId));
	} catch (error) {
		console.error('[classify-post]', error);
		return Response.json({ error: 'La IA no pudo asignar categoría y palabras clave. Inténtalo de nuevo.' }, { status: 502 });
	}
};
