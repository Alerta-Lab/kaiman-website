import type { APIRoute } from 'astro';
import { saveCategory } from '../../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, redirect }) => {
	const form = await request.formData();
	await saveCategory({ name: String(form.get('name') ?? ''), nameEn: String(form.get('nameEn') ?? '') });
	return redirect('/admin/categorias', 303);
};
