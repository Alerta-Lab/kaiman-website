import { describe, expect, it, vi } from 'vitest';

const convert = vi.hoisted(() => vi.fn());
vi.mock('mammoth', () => ({ default: { convertToMarkdown: convert } }));
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
});
