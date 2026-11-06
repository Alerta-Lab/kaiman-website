import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getEnv } from '../../../server/env';

const chatUrl = 'https://wizard-ai-api.com/api/public/kaiman/chat';
const inputSchema = z.object({
	message: z.string().trim().min(1).max(2000),
	locale: z.enum(['es', 'en']).default('es'),
	session_id: z.string().trim().min(1).max(200).optional(),
}).strict();
const outputSchema = z.object({
	role: z.literal('assistant'),
	content: z.string().min(1),
	session_id: z.string().min(1),
	sources: z.array(z.string()).default([]),
});

function json(body: unknown, status: number, extraHeaders: HeadersInit = {}) {
	return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extraHeaders } });
}

export const POST: APIRoute = async ({ request }) => {
	const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
	if (contentType !== 'application/json') return json({ error: 'Content-Type must be application/json.', code: 'invalid_request' }, 415);
	const declaredLength = Number(request.headers.get('content-length'));
	if (declaredLength > 8192) return json({ error: 'Request is too large.', code: 'invalid_request' }, 413);
	let body: unknown;
	try {
		const reader = request.body?.getReader();
		if (!reader) return json({ error: 'Invalid JSON.', code: 'invalid_request' }, 400);
		const chunks: Uint8Array[] = [];
		let length = 0;
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			length += value.byteLength;
			if (length > 8192) {
				await reader.cancel();
				return json({ error: 'Request is too large.', code: 'invalid_request' }, 413);
			}
			chunks.push(value);
		}
		const bytes = new Uint8Array(length);
		let offset = 0;
		for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
		body = JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		return json({ error: 'Invalid JSON.', code: 'invalid_request' }, 400);
	}
	const input = inputSchema.safeParse(body);
	if (!input.success) return json({ error: 'Invalid message, locale or session_id.', code: 'invalid_request' }, 400);

	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	const key = getEnv('KAIMAN_PUBLIC_CHAT_API_KEY');
	if (key) headers['X-Kaiman-Public-Chat-Key'] = key;
	let upstream: Response;
	try {
		upstream = await fetch(chatUrl, {
			method: 'POST', headers, body: JSON.stringify(input.data), signal: AbortSignal.timeout(30000),
		});
	} catch (error) {
		if (error instanceof Error && error.name === 'TimeoutError') return json({ error: 'Chat service timed out.', code: 'timeout' }, 504);
		return json({ error: 'Chat service unavailable.', code: 'upstream_unavailable' }, 502);
	}
	if (upstream.status === 429) {
		const retry = upstream.headers.get('retry-after');
		return json({ error: 'Too many requests. Please try again later.', code: 'rate_limited' }, 429, retry ? { 'Retry-After': retry } : {});
	}
	if (!upstream.ok) return json({ error: 'Chat service unavailable.', code: 'upstream_unavailable' }, 502);
	try {
		const result = outputSchema.safeParse(await upstream.json());
		if (!result.success) return json({ error: 'Invalid response from chat service.', code: 'invalid_upstream_response' }, 502);
		return json(result.data, 200);
	} catch {
		return json({ error: 'Invalid response from chat service.', code: 'invalid_upstream_response' }, 502);
	}
};
