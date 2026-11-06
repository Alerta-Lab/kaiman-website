import type { APIRoute } from 'astro';
import { imagePrompts } from '../../../../../server/blog-images';
import { getPostById } from '../../../../../server/repositories/posts';

export const POST: APIRoute = async ({ params, locals, request }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	const post = params.id ? await getPostById(params.id) : null;
	if (!post?.editorial?.approvedAt || post.status !== 'draft') return Response.json({ error: 'Acepta el contenido guardado antes de preparar las imágenes.' }, { status: 409 });
	let aspect: '9:16' | '3:2';
	try { const body = await request.json(); if (body.bodyAspect !== '9:16' && body.bodyAspect !== '3:2') throw new Error(); aspect = body.bodyAspect; }
	catch { return Response.json({ error: 'Selecciona un formato válido.' }, { status: 400 }); }
	const [cover, body] = imagePrompts(post, aspect);
	return Response.json({ cover, body, updatedAt: post.updatedAt.toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
};
