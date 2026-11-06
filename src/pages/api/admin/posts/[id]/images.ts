import type { APIRoute } from 'astro';
import { getPostById } from '../../../../../server/repositories/posts';
import { generateBlogImages } from '../../../../../server/blog-images';
import type { ImageProgressEvent } from '../../../../../features/posts/image-progress';
import { z } from 'zod';

const bodySchema = z.object({
	bodyAspect: z.enum(['9:16', '3:2']),
	updatedAt: z.string().optional(),
	prompts: z.object({ cover: z.string().trim().min(1).max(30000), body: z.string().trim().min(1).max(30000) }).optional(),
});

export const POST: APIRoute = async ({ params, locals, request }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	const post = params.id ? await getPostById(params.id) : null;
	if (!post?.editorial?.approvedAt || post.status !== 'draft') return Response.json({ error: 'Acepta el contenido guardado antes de generar imágenes.' }, { status: 409 });
	let data: z.infer<typeof bodySchema>;
	try { data = bodySchema.parse(await request.json()); }
	catch { return Response.json({ error: 'Revisa el formato y las indicaciones de ambas imágenes.' }, { status: 400 }); }
	if (data.prompts && (!data.updatedAt || new Date(data.updatedAt).getTime() !== post.updatedAt?.getTime())) return Response.json({ error: 'El artículo cambió. Actualiza las indicaciones antes de generar.' }, { status: 409 });
	const encoder = new TextEncoder();
	let connected = true;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const send = (event: ImageProgressEvent) => { if (connected) { try { controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); } catch { connected = false; } } };
			void (async () => {
				try {
					const result = await generateBlogImages(post, data.bodyAspect, send, data.prompts ? [data.prompts.cover, data.prompts.body] : undefined);
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
