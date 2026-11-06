import { put } from '@vercel/blob';
import type { APIRoute } from 'astro';
import { requireDb } from '../../../server/db/client';
import { media } from '../../../server/db/schema';
import { getEnv } from '../../../server/env';
import { deleteMedia, listMedia } from '../../../server/repositories/media';

export const GET: APIRoute = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = Number(url.searchParams.get('pageSize') ?? '12');
	const result = await listMedia({
		query,
		page: Number.isFinite(page) ? page : 1,
		pageSize: Number.isFinite(pageSize) ? pageSize : 12,
	});
	return Response.json(result);
};

export const POST: APIRoute = async ({ request }) => {
	const form = await request.formData();
	const image = form.get('image');
	const alt = String(form.get('alt') ?? '').trim();
	if (!(image instanceof File) || !image.type.startsWith('image/') || image.size > 8 * 1024 * 1024) {
		return Response.json({ error: 'Usa una imagen de hasta 8 MB.' }, { status: 400 });
	}
	if (!alt) return Response.json({ error: 'El texto alternativo es obligatorio.' }, { status: 400 });
	const blob = await put(`images/${crypto.randomUUID()}-${image.name}`, image, {
		access: 'public',
		token: getEnv('BLOB_READ_WRITE_TOKEN'),
	});
	const [record] = await requireDb()
		.insert(media)
		.values({
			url: blob.url,
			pathname: blob.pathname,
			filename: image.name,
			mimeType: image.type,
			alt,
		})
		.returning();
	return Response.json(record, { status: 201 });
};

export const DELETE: APIRoute = async ({ request }) => {
	let id = '';
	const contentType = request.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		const body = (await request.json()) as { id?: string };
		id = String(body.id ?? '');
	} else {
		const form = await request.formData();
		id = String(form.get('id') ?? '');
	}
	if (!id) return Response.json({ error: 'Falta el id.' }, { status: 400 });
	const deleted = await deleteMedia(id);
	if (!deleted) return Response.json({ error: 'Imagen no encontrada.' }, { status: 404 });
	return Response.json({ ok: true });
};
