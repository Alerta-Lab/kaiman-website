import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './server/auth';

const protectedPath = (pathname: string) =>
	(pathname.startsWith('/admin') && pathname !== '/admin/login') || pathname.startsWith('/api/admin');

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.admin = null;
	try {
		context.locals.admin = await getSessionUser(context.cookies);
	} catch {
		// Public pages remain available before infrastructure is provisioned.
	}

	if (protectedPath(context.url.pathname) && !context.locals.admin) {
		if (context.url.pathname.startsWith('/api/')) {
			return Response.json({ error: 'No autorizado.' }, { status: 401 });
		}
		return context.redirect(`/admin/login?next=${encodeURIComponent(context.url.pathname)}`);
	}

	const response = await next();
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('X-Frame-Options', 'DENY');
	return response;
});
