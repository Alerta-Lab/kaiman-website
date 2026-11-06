import type { APIRoute } from 'astro';
import { deleteCategory, saveCategory } from '../../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, params, redirect }) => {
	const form = await request.formData();
	if (form.get('_method') === 'delete') await deleteCategory(params.id!);
	if (form.get('_method') === 'update') await saveCategory({ name: String(form.get('name') ?? ''), nameEn: String(form.get('nameEn') ?? '') }, params.id);
	return redirect('/admin/categorias', 303);
};
