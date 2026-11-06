import type { APIRoute } from 'astro';
import { deleteTag, saveTag } from '../../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, params, redirect }) => {
	const form = await request.formData();
	if (form.get('_method') === 'delete') await deleteTag(params.id!);
	if (form.get('_method') === 'update') {
		await saveTag(
			{
				name: String(form.get('name') ?? ''),
				nameEn: String(form.get('nameEn') ?? ''),
			},
			params.id,
		);
	}
	return redirect('/admin/tags', 303);
};
