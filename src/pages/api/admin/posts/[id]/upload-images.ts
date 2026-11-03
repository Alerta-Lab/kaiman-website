import type { APIRoute } from 'astro';
import { getPostById } from '../../../../../server/repositories/posts';
import { uploadLocalBlogImages } from '../../../../../server/blog-images';

export const POST: APIRoute = async ({ params, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	const post = params.id ? await getPostById(params.id) : null;
	if (!post || post.status !== 'draft' || !post.editorial) return Response.json({ error: 'No se encontró el borrador.' }, { status: 404 });
	try { return Response.json(await uploadLocalBlogImages(post)); }
	catch (error) { console.error('[upload-blog-images]', error); return Response.json({ error: 'No se pudieron subir las imágenes locales. Verifica que sigan en este equipo y que Blob esté configurado.' }, { status: 502 }); }
};
