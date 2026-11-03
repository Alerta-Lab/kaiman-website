import { put } from '@vercel/blob';
import type { APIRoute } from 'astro';
import { requireDb } from '../../../server/db/client';
import { media } from '../../../server/db/schema';
import { getEnv } from '../../../server/env';

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
	const [record] = await requireDb().insert(media).values({
		url: blob.url,
		pathname: blob.pathname,
		filename: image.name,
		mimeType: image.type,
		alt,
	}).returning();
	return Response.json(record, { status: 201 });
};
