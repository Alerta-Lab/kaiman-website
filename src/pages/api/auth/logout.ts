import type { APIRoute } from 'astro';
import { logout } from '../../../server/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
	try {
		await logout(cookies);
	} finally {
		return redirect('/admin/login');
	}
};
