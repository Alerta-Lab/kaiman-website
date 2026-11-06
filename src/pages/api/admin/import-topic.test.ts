import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ save: vi.fn(), apply: vi.fn(), categories: vi.fn(), tags: vi.fn(), auto: vi.fn() }));
vi.mock('../../../server/import-posts', () => ({ saveImportedTopic: mocks.save }));
vi.mock('../../../server/auto-classify', () => ({ classifyTranslationGroup: mocks.auto }));
vi.mock('../../../server/repositories/posts', () => ({ listCategories: mocks.categories, listTags: mocks.tags, applyClassification: mocks.apply }));
import { POST } from './import-topic';

const call = (body: unknown) => POST({ locals: { admin: { id: 'admin' } }, request: new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) } as never);
const classification = { category: { name: 'Barberías', nameEn: 'Barbershops', slug: '' }, tags: [{ name: 'fidelización', nameEn: 'loyalty' }] };

beforeEach(() => {
	vi.clearAllMocks();
	mocks.categories.mockResolvedValue([]); mocks.tags.mockResolvedValue([]);
	mocks.save.mockResolvedValue({ translationGroupId: 'group', created: [{ id: 'post', locale: 'es' }] });
	mocks.apply.mockResolvedValue({ category: { name: 'Barberías', nameEn: 'Barbershops', slug: 'barberias' }, categoryCreated: true });
});

describe('import topic classification review', () => {
	it('applies reviewed suggestions without calling AI a second time', async () => {
		const response = await call({ versions: [], classification });
		expect(response.status).toBe(201);
		expect(mocks.apply).toHaveBeenCalledWith('group', expect.objectContaining({ category: expect.objectContaining({ name: 'Barberías' }), tags: expect.arrayContaining([expect.objectContaining({ name: 'fidelización' })]) }));
		expect(mocks.auto).not.toHaveBeenCalled();
	});
	it('does not create drafts when reviewed suggestions are invalid', async () => {
		const response = await call({ versions: [], classification: { ...classification, category: { name: '', nameEn: '' } } });
		expect(response.status).toBe(400); expect(mocks.save).not.toHaveBeenCalled();
	});
	it('does not overwrite a shared keyword translation', async () => {
		mocks.tags.mockResolvedValue([{ slug: 'fidelizacion', name: 'fidelización', nameEn: 'customer loyalty' }]);
		const response = await call({ versions: [], classification });
		expect(response.status).toBe(400); expect(mocks.save).not.toHaveBeenCalled();
	});
	it('saves without classification if the suggestion was unavailable', async () => {
		const response = await call({ versions: [], classification: null });
		expect(response.status).toBe(201); expect(mocks.apply).not.toHaveBeenCalled(); expect(mocks.auto).not.toHaveBeenCalled();
	});
});
