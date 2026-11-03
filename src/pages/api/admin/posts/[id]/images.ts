import type { APIRoute } from 'astro';
import { getPostById } from '../../../../../server/repositories/posts';
import { generateBlogImages } from '../../../../../server/blog-images';
import type { ImageProgressEvent } from '../../../../../features/posts/image-progress';

export const POST: APIRoute = async ({ params, locals, request }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	const post = params.id ? await getPostById(params.id) : null;
	if (!post?.editorial?.approvedAt || post.status !== 'draft') return Response.json({ error: 'Acepta el contenido guardado antes de generar imágenes.' }, { status: 409 });
	let aspect: '9:16' | '3:2';
	try { const data = await request.json(); if (data.bodyAspect !== '9:16' && data.bodyAspect !== '3:2') throw new Error(); aspect = data.bodyAspect; }
	catch { return Response.json({ error: 'Selecciona un formato de imagen válido.' }, { status: 400 }); }
	const encoder = new TextEncoder();
	let connected = true;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const send = (event: ImageProgressEvent) => { if (connected) { try { controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); } catch { connected = false; } } };
			void (async () => {
				try {
					const result = await generateBlogImages(post, aspect, send);
					send({ type: 'complete', ...result });
				} catch (error) {
					console.error('[blog-images]', error);
					send({ type: 'error', message: 'No se pudieron generar y guardar ambas imágenes. Revisa la configuración antes de intentar de nuevo.' });
				} finally { if (connected) { try { controller.close(); } catch { /* Client disconnected. */ } } }
			})();
		},
		cancel() { connected = false; },
	});
	return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' } });
};
