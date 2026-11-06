import type { APIRoute } from 'astro';
import { saveTag } from '../../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, redirect }) => {
	const form = await request.formData();
	await saveTag({
		name: String(form.get('name') ?? ''),
		nameEn: String(form.get('nameEn') ?? ''),
	});
	return redirect('/admin/tags', 303);
};
