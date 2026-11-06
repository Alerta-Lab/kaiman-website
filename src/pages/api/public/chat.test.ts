import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './chat';

const request = (body: unknown) => new Request('http://localhost/api/public/chat', {
	method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const call = (body: unknown) => POST({ request: request(body) } as never);

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe('public chat proxy', () => {
	it('forwards locale and session, keeps the key server-side and returns the public response', async () => {
		vi.stubEnv('KAIMAN_PUBLIC_CHAT_API_KEY', 'server-only-test-key');
		const upstream = vi.fn().mockResolvedValue(Response.json({ role: 'assistant', content: 'Hola', session_id: 'session-1', sources: ['faq'], internal: 'hidden' }));
		vi.stubGlobal('fetch', upstream);
		const response = await call({ message: ' Hola ', locale: 'es', session_id: 'session-1' });
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ role: 'assistant', content: 'Hola', session_id: 'session-1', sources: ['faq'] });
		expect(upstream).toHaveBeenCalledWith('https://wizard-ai-api.com/api/public/kaiman/chat', expect.objectContaining({
			headers: expect.objectContaining({ 'X-Kaiman-Public-Chat-Key': 'server-only-test-key' }),
			body: JSON.stringify({ message: 'Hola', locale: 'es', session_id: 'session-1' }),
		}));
	});
	it('rejects invalid input before calling the backend', async () => {
		const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
		for (const body of [{ message: ' ' }, { message: 'x', locale: 'fr' }, { message: 'x'.repeat(2001) }, { message: 'x', session_id: '' }, { message: 'x', api_key: 'no' }]) {
			expect((await call(body)).status).toBe(400);
		}
		expect(upstream).not.toHaveBeenCalled();
	});
	it('rejects an oversized streamed body without calling the backend', async () => {
		const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
		const response = await POST({ request: new Request('http://localhost/api/public/chat', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'x'.repeat(9000) }),
		}) } as never);
		expect(response.status).toBe(413);
		expect(upstream).not.toHaveBeenCalled();
	});
	it('propagates rate limits and retry-after without exposing upstream errors', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret', { status: 429, headers: { 'Retry-After': '60' } })));
		const response = await call({ message: 'Hello', locale: 'en' });
		expect(response.status).toBe(429);
		expect(response.headers.get('retry-after')).toBe('60');
		expect(await response.json()).toEqual({ error: 'Too many requests. Please try again later.', code: 'rate_limited' });
	});
	it('maps upstream failures and malformed responses to safe errors', async () => {
		for (const upstream of [new Response('secret', { status: 401 }), Response.json({ role: 'assistant' })]) {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream));
			const response = await call({ message: 'Hola' });
			expect(response.status).toBe(502);
			expect(JSON.stringify(await response.json())).not.toContain('secret');
		}
	});
	it('reports timeout without retrying', async () => {
		const upstream = vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
		vi.stubGlobal('fetch', upstream);
		expect((await call({ message: 'Hola' })).status).toBe(504);
		expect(upstream).toHaveBeenCalledOnce();
	});
});
