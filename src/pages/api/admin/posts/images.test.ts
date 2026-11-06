import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getPostById: vi.fn(), generateBlogImages: vi.fn() }));
vi.mock('../../../../server/repositories/posts', () => ({ getPostById: mocks.getPostById }));
vi.mock('../../../../server/blog-images', () => ({ generateBlogImages: mocks.generateBlogImages }));
import { POST } from './[id]/images';

describe('protección de generación de imágenes', () => {
	beforeEach(() => vi.resetAllMocks());
	it('no genera imágenes para contenido sin aceptar', async () => {
		mocks.getPostById.mockResolvedValue({ status: 'draft', editorial: { approvedAt: null } });
		const response = await POST({ params: { id: 'test' }, locals: { admin: { id: 'admin' } }, request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ bodyAspect: '9:16' }) }) } as never);
		expect(response.status).toBe(409);
		expect(mocks.generateBlogImages).not.toHaveBeenCalled();
	});
	it('usa el generador simulado solo después de aceptar', async () => {
		mocks.getPostById.mockResolvedValue({ status: 'draft', editorial: { approvedAt: '2026-01-01' } });
		mocks.generateBlogImages.mockImplementation(async (_post, _aspect, progress) => { progress({ type: 'generating', image: 'cover' }); progress({ type: 'uploading', image: 'cover', percentage: 50 }); return { coverUrl: '/cover', bodyImageUrl: '/body' }; });
		const response = await POST({ params: { id: 'test' }, locals: { admin: { id: 'admin' } }, request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ bodyAspect: '3:2' }) }) } as never);
		expect(response.status).toBe(200);
		const events = (await response.text()).trim().split('\n').map((line) => JSON.parse(line));
		expect(events.map((event) => event.type)).toEqual(['generating', 'uploading', 'complete']);
		expect(events[1].percentage).toBe(50);
		expect(mocks.generateBlogImages).toHaveBeenCalledOnce();
	});
	it('informa el fallo sin enviar detalles internos al navegador', async () => {
		mocks.getPostById.mockResolvedValue({ status: 'draft', editorial: { approvedAt: '2026-01-01' } });
		mocks.generateBlogImages.mockRejectedValue(new Error('detalle interno'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const response = await POST({ params: { id: 'test' }, locals: { admin: { id: 'admin' } }, request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({ bodyAspect: '9:16' }) }) } as never);
			const event = JSON.parse((await response.text()).trim());
			expect(event.type).toBe('error');
			expect(event.message).not.toContain('detalle interno');
		} finally { log.mockRestore(); }
	});
});
