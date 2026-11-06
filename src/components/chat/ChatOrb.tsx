import { MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '../../i18n';
import type { LandingCopy } from '../../i18n/locales/es/landing';

type ChatCopy = LandingCopy['chat'];

type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
};

type Props = {
	locale: Locale;
	copy: ChatCopy;
};

const CHAT_PARAM = 'asistente';
const CHAT_VALUE = 'kaiman';

function mapError(code: string | undefined, copy: ChatCopy) {
	if (code === 'invalid_request') return copy.errorInvalid;
	if (code === 'rate_limited') return copy.errorRate;
	if (code === 'timeout') return copy.errorTimeout;
	if (code === 'upstream_unavailable' || code === 'invalid_upstream_response') return copy.errorUnavailable;
	return copy.errorGeneric;
}

function urlHasChatOpen() {
	if (typeof window === 'undefined') return false;
	const value = new URLSearchParams(window.location.search).get(CHAT_PARAM);
	return value === CHAT_VALUE || value === '1' || value === 'true';
}

function syncChatUrl(open: boolean) {
	if (typeof window === 'undefined') return;
	const url = new URL(window.location.href);
	if (open) url.searchParams.set(CHAT_PARAM, CHAT_VALUE);
	else url.searchParams.delete(CHAT_PARAM);
	const next = `${url.pathname}${url.search}${url.hash}`;
	const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	if (next !== current) history.replaceState(null, '', next);
}

/** Renders `**bold**` as strong; leaves other text plain (no HTML injection). */
function renderMessageText(content: string) {
	const parts = content.split(/(\*\*[^*]+\*\*)/g);
	return parts.map((part, index) => {
		if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
			return (
				<strong key={index} className="font-semibold">
					{part.slice(2, -2)}
				</strong>
			);
		}
		return <span key={index}>{part}</span>;
	});
}

export function ChatOrb({ locale, copy }: Props) {
	const panelId = useId();
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState('');
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const setOpenSynced = useCallback((next: boolean | ((current: boolean) => boolean)) => {
		setOpen((current) => {
			const value = typeof next === 'function' ? next(current) : next;
			syncChatUrl(value);
			return value;
		});
	}, []);

	const reset = useCallback(() => {
		setMessages([]);
		setSessionId(null);
		setError(null);
		setDraft('');
	}, []);

	useEffect(() => {
		if (urlHasChatOpen()) setOpen(true);
		const onPop = () => setOpen(urlHasChatOpen());
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	}, []);

	useEffect(() => {
		if (!open) return;
		inputRef.current?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpenSynced(false);
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', onKey);
		};
	}, [open, setOpenSynced]);

	useEffect(() => {
		const el = listRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [messages, busy, open]);

	const send = async () => {
		const message = draft.trim();
		if (!message || busy) return;
		setDraft('');
		setError(null);
		setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: message }]);
		setBusy(true);
		try {
			const response = await fetch('/api/public/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message,
					locale,
					...(sessionId ? { session_id: sessionId } : {}),
				}),
			});
			const payload = (await response.json().catch(() => ({}))) as {
				content?: string;
				session_id?: string;
				code?: string;
			};
			if (!response.ok) {
				setError(mapError(payload.code, copy));
				return;
			}
			if (payload.session_id) setSessionId(payload.session_id);
			setMessages((current) => [
				...current,
				{ id: crypto.randomUUID(), role: 'assistant', content: payload.content ?? '' },
			]);
		} catch {
			setError(copy.errorGeneric);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="pointer-events-auto fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
			{open && (
				<section
					id={panelId}
					role="dialog"
					aria-modal="true"
					aria-label={copy.title}
					className="fixed inset-0 z-[90] flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#0b141a] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:static sm:inset-auto sm:z-auto sm:h-[min(36rem,78vh)] sm:w-[min(26rem,calc(100vw-2.5rem))] sm:rounded-2xl sm:border sm:border-primary/35 sm:pt-0 sm:pb-0 sm:shadow-[0_0_0_1px_rgba(107,72,233,0.25),0_24px_64px_rgba(0,0,0,0.5),0_0_40px_rgba(107,72,233,0.22)]"
				>
					<header className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#111b21] px-4 py-3">
						<div className="min-w-0">
							<p className="font-headline text-base font-bold text-white">{copy.title}</p>
							<p className="mt-0.5 font-body text-xs font-normal text-white/55">{copy.subtitle}</p>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							<button
								type="button"
								onClick={reset}
								aria-label={copy.newChat}
								title={copy.newChat}
								className="inline-flex size-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
							>
								<RotateCcw size={17} aria-hidden />
							</button>
							<button
								type="button"
								onClick={() => setOpenSynced(false)}
								aria-label={copy.close}
								className="inline-flex size-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
							>
								<X size={18} aria-hidden />
							</button>
						</div>
					</header>

					<div
						ref={listRef}
						className="flex-1 space-y-2 overflow-y-auto bg-[#0b141a] px-3 py-4 sm:px-4"
						aria-live="polite"
					>
						{messages.length === 0 && !busy && (
							<p className="px-1 font-body text-sm font-normal text-white/50">{copy.empty}</p>
						)}
						{messages.map((item) => (
							<div
								key={item.id}
								className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`relative max-w-[85%] px-3 py-2 font-body text-[0.9375rem] leading-relaxed font-normal whitespace-pre-wrap ${
										item.role === 'user'
											? 'rounded-2xl rounded-br-md bg-primary text-white'
											: 'rounded-2xl rounded-bl-md bg-[#202c33] text-white/95'
									}`}
								>
									{renderMessageText(item.content)}
								</div>
							</div>
						))}
						{busy && (
							<div className="flex justify-start">
								<p className="rounded-2xl rounded-bl-md bg-[#202c33] px-3 py-2 font-body text-sm text-white/55">
									{copy.sending}
								</p>
							</div>
						)}
						{error && (
							<p role="alert" className="rounded-xl bg-error-100/15 px-3 py-2 font-body text-sm text-error">
								{error}
							</p>
						)}
					</div>

					<form
						className="border-t border-white/10 bg-[#111b21] p-3"
						onSubmit={(event) => {
							event.preventDefault();
							void send();
						}}
					>
						<div className="flex items-end gap-2">
							<label className="sr-only" htmlFor={`${panelId}-input`}>
								{copy.placeholder}
							</label>
							<textarea
								id={`${panelId}-input`}
								ref={inputRef}
								rows={2}
								maxLength={2000}
								value={draft}
								disabled={busy}
								placeholder={copy.placeholder}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' && !event.shiftKey) {
										event.preventDefault();
										void send();
									}
								}}
								className="min-h-11 w-full resize-none rounded-xl border border-white/15 bg-[#0b141a] px-3 py-2 font-body text-sm font-normal text-white outline-none placeholder:text-white/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
							/>
							<button
								type="submit"
								disabled={busy || !draft.trim()}
								aria-label={copy.send}
								className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-700 disabled:opacity-45"
							>
								<Send size={18} aria-hidden />
							</button>
						</div>
					</form>
				</section>
			)}

			<span className={`relative inline-flex size-14 items-center justify-center ${open ? 'max-sm:hidden' : ''}`}>
				<span className="chat-orb-spin absolute inset-0 rounded-full" aria-hidden="true" />
				<button
					type="button"
					aria-expanded={open}
					aria-controls={panelId}
					aria-label={open ? copy.close : copy.open}
					onClick={() => setOpenSynced((current) => !current)}
					className="relative z-10 inline-flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_28px_rgba(107,72,233,0.55)] transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					{open ? <X size={22} aria-hidden /> : <MessageCircle size={22} aria-hidden />}
				</button>
			</span>
		</div>
	);
}
