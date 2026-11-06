import type { APIRoute } from 'astro';
import { toApiError } from '../../../../lib/api-errors';
import { listAllPosts, savePost } from '../../../../server/repositories/posts';

export const GET: APIRoute = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
	const result = await listAllPosts({
		query,
		page: Number.isFinite(page) ? page : 1,
		pageSize: Number.isFinite(pageSize) ? pageSize : 10,
	});
	return Response.json({
		...result,
		items: result.items.map((post) => ({
			...post,
			publishedAt: post.publishedAt?.toISOString() ?? null,
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
			tags: post.tags.map((tag) => ({
				...tag,
				createdAt: tag.createdAt.toISOString(),
			})),
			category: post.category
				? { ...post.category, createdAt: post.category.createdAt.toISOString() }
				: null,
		})),
	});
};

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const post = await savePost(await request.json(), locals.admin!.id);
		return Response.json(post, { status: 201 });
	} catch (error) {
		return Response.json(toApiError(error), { status: 400 });
	}
};
