import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getPostById: vi.fn(), getSiblingPost: vi.fn(), upsertTranslationDraft: vi.fn(), translatePostContent: vi.fn() }));
vi.mock('../../../../server/repositories/posts', () => mocks);
vi.mock('../../../../server/translate-post', () => ({ translatePostContent: mocks.translatePostContent }));
import { POST } from './[id]/translate';

describe('traducción de artículos', () => {
	beforeEach(() => vi.resetAllMocks());
	it('protege una versión existente sin llamar a IA ni escribir en la base de datos', async () => {
		mocks.getPostById.mockResolvedValue({ locale: 'es', translationGroupId: 'group' });
		mocks.getSiblingPost.mockResolvedValue({ status: 'published' });
		const response = await POST({ params: { id: '123' }, locals: { admin: { id: 'admin' } } } as never);
		expect(response.status).toBe(409);
		expect(mocks.translatePostContent).not.toHaveBeenCalled();
		expect(mocks.upsertTranslationDraft).not.toHaveBeenCalled();
	});
});
