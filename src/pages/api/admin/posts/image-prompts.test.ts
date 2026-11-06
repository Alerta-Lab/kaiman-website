import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getPostById: vi.fn(), imagePrompts: vi.fn() }));
vi.mock('../../../../server/repositories/posts', () => ({ getPostById: mocks.getPostById }));
vi.mock('../../../../server/blog-images', () => ({ imagePrompts: mocks.imagePrompts }));
import { POST } from './[id]/image-prompts';

describe('image prompt preview', () => {
	beforeEach(() => vi.resetAllMocks());
	it('returns instructions without generating images', async () => {
		mocks.getPostById.mockResolvedValue({ status: 'draft', updatedAt: new Date('2026-01-01'), editorial: { approvedAt: '2026-01-01' } });
		mocks.imagePrompts.mockReturnValue(['cover', 'body']);
		const response = await POST({ params: { id: '1' }, locals: { admin: { id: 'a' } }, request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ bodyAspect: '3:2' }) }) } as never);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ cover: 'cover', body: 'body', updatedAt: '2026-01-01T00:00:00.000Z' });
		expect(mocks.imagePrompts).toHaveBeenCalledWith(expect.anything(), '3:2');
	});
	it('requires accepted content', async () => {
		mocks.getPostById.mockResolvedValue({ status: 'draft', editorial: { approvedAt: null } });
		const response = await POST({ params: { id: '1' }, locals: { admin: { id: 'a' } }, request: new Request('http://localhost', { method: 'POST' }) } as never);
		expect(response.status).toBe(409); expect(mocks.imagePrompts).not.toHaveBeenCalled();
	});
});
