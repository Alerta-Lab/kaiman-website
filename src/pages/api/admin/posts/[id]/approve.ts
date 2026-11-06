import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { requireDb } from '../../../../../server/db/client';
import { posts } from '../../../../../server/db/schema';

export const POST: APIRoute = async ({ params, locals, request }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	if (!params.id) return Response.json({ error: 'Falta el artículo.' }, { status: 400 });
	let revision: unknown;
	try { revision = (await request.json()).updatedAt; } catch { return Response.json({ error: 'No se recibió la versión guardada.' }, { status: 400 }); }
	if (typeof revision !== 'string' || !Number.isFinite(Date.parse(revision))) return Response.json({ error: 'No se recibió una fecha válida.' }, { status: 400 });
	const result = await requireDb().transaction(async (tx) => {
		const [post] = await tx.select().from(posts).where(eq(posts.id, params.id!)).for('update');
		if (!post || post.status !== 'draft' || !post.editorial) return 'missing';
		if (post.updatedAt.getTime() !== Date.parse(revision as string)) return 'changed';
		await tx.update(posts).set({ editorial: { ...post.editorial, approvedAt: new Date().toISOString() } }).where(eq(posts.id, post.id));
		return 'ok';
	});
	if (result === 'missing') return Response.json({ error: 'No hay un borrador importado para aceptar.' }, { status: 404 });
	if (result === 'changed') return Response.json({ error: 'El artículo cambió. Actualiza la página antes de aceptarlo.' }, { status: 409 });
	return Response.json({ ok: true });
};
