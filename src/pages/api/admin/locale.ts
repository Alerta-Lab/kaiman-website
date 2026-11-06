import type { APIRoute } from 'astro';
import { parseContentLocale, setAdminLocale } from '../../../server/admin-locale';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const form = await request.formData();
	const locale = parseContentLocale(form.get('locale'));
	if (locale) setAdminLocale(cookies, locale);

	const redirectTo = String(form.get('redirect') ?? '/admin');
	const safePath = redirectTo.startsWith('/admin') ? redirectTo : '/admin';
	return redirect(safePath, 303);
};
