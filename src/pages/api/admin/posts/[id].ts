import type { APIRoute } from 'astro';
import { toApiError } from '../../../../lib/api-errors';
import { deletePost, savePost } from '../../../../server/repositories/posts';

export const PUT: APIRoute = async ({ request, locals, params }) => {
	try {
		const post = await savePost(await request.json(), locals.admin!.id, params.id);
		return Response.json(post);
	} catch (error) {
		return Response.json(toApiError(error), { status: 400 });
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	await deletePost(params.id!);
	return new Response(null, { status: 204 });
};
