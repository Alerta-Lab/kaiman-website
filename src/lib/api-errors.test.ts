import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toApiError } from './api-errors';

describe('toApiError', () => {
	it('traduce errores de markdown demasiado corto', () => {
		const schema = z.object({ markdown: z.string().trim().min(20) });
		try {
			schema.parse({ markdown: 'corto' });
		} catch (error) {
			const payload = toApiError(error);
			expect(payload.error).toContain('Contenido Markdown');
			expect(payload.error).toContain('20');
			expect(payload.detail).toContain('too_small');
		}
	});
});
