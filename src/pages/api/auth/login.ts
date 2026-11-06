import type { APIRoute } from 'astro';
import { login } from '../../../server/auth';

const attempts = new Map<string, { count: number; reset: number }>();

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
	const now = Date.now();
	const current = attempts.get(clientAddress);
	if (current && current.reset > now && current.count >= 5) {
		return new Response('Demasiados intentos. Intenta en 15 minutos.', { status: 429 });
	}
	const form = await request.formData();
	const email = String(form.get('email') ?? '');
	const password = String(form.get('password') ?? '');
	try {
		const user = await login(email, password, cookies);
		if (!user) {
			attempts.set(clientAddress, { count: (current?.count ?? 0) + 1, reset: now + 900_000 });
			return redirect('/admin/login?error=1');
		}
		attempts.delete(clientAddress);
		const next = String(form.get('next') ?? '/admin');
		return redirect(next.startsWith('/admin') ? next : '/admin');
	} catch (error) {
		console.error('[auth/login]', error);
		return redirect('/admin/login?setup=1');
	}
};
