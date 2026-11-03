import type { APIRoute } from 'astro';
import { toApiError } from '../../../../lib/api-errors';
import { savePost } from '../../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const post = await savePost(await request.json(), locals.admin!.id);
		return Response.json(post, { status: 201 });
	} catch (error) {
		return Response.json(toApiError(error), { status: 400 });
	}
};
