import { describe, expect, it, vi } from 'vitest';

const convert = vi.hoisted(() => vi.fn());
const mocks = vi.hoisted(() => ({ analyze: vi.fn(), classify: vi.fn(), categories: vi.fn(), tags: vi.fn() }));
vi.mock('mammoth', () => ({ default: { convertToMarkdown: convert } }));
vi.mock('../../../server/ai-word-import', () => ({ analyzeWordWithAi: mocks.analyze }));
vi.mock('../../../server/classify-post', () => ({ classifyPost: mocks.classify }));
vi.mock('../../../server/repositories/posts', () => ({ listCategories: mocks.categories, listTags: mocks.tags }));
import { POST } from './preview-word';

describe('vista previa de Word', () => {
	it('rechaza solicitudes sin sesión antes de procesar el archivo', async () => {
		const response = await POST({ locals: { admin: null } } as never);
		expect(response.status).toBe(401);
		expect(convert).not.toHaveBeenCalled();
	});
	it('no llama al conversor para formatos no admitidos', async () => {
		const form = new FormData();
		form.set('document', new File(['texto'], 'articulo.txt'));
		const response = await POST({ locals: { admin: { id: 'admin' } }, request: new Request('http://localhost', { method: 'POST', body: form }) } as never);
		expect(response.status).toBe(400);
		expect(convert).not.toHaveBeenCalled();
	});
	it('includes editable suggestions in the preview without saving drafts', async () => {
		convert.mockResolvedValue({ value: 'Original', messages: [] });
		mocks.analyze.mockResolvedValue({ topics: [{ label: 'Tema', versions: [{ locale: 'es', title: 'Título', excerpt: 'Resumen', markdown: 'Contenido' }] }], excludedBlocks: [] });
		mocks.categories.mockResolvedValue([]); mocks.tags.mockResolvedValue([]);
		mocks.classify.mockResolvedValue({ category: { slug: 'barberias', name: 'Barberías', nameEn: 'Barbershops', isNew: true }, tags: [] });
		const form = new FormData(); form.set('document', new File(['contenido'], 'articulo.docx'));
		const response = await POST({ locals: { admin: { id: 'admin' } }, request: new Request('http://localhost', { method: 'POST', body: form }) } as never);
		expect(response.status).toBe(200);
		const result = await response.json();
		expect(result.suggestions[0].category.name).toBe('Barberías');
		expect(result.sourceMarkdown).toBe('Original');
	});
});
