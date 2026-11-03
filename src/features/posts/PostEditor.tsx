import { Languages, Save, Sparkles, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast, type ToastTone } from '../../components/blog/molecules/Toast';

type Initial = {
	id?: string;
	title?: string;
	slug?: string;
	excerpt?: string;
	markdown?: string;
	status?: 'draft' | 'published';
	locale?: 'es' | 'en';
	seoTitle?: string;
	seoDescription?: string;
	coverUrl?: string | null;
	coverAlt?: string | null;
	tags?: string[];
};

type Notice = {
	tone: ToastTone;
	title: string;
	detail?: string | null;
};

const slugify = (value: string) =>
	value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function PostEditor({ initial = {} }: { initial?: Initial }) {
	const [data, setData] = useState({
		title: initial.title ?? '',
		slug: initial.slug ?? '',
		excerpt: initial.excerpt ?? '',
		markdown: initial.markdown ?? '',
		status: initial.status ?? 'draft',
		locale: initial.locale ?? 'es',
		seoTitle: initial.seoTitle ?? '',
		seoDescription: initial.seoDescription ?? '',
		coverUrl: initial.coverUrl ?? '',
		coverAlt: initial.coverAlt ?? '',
		tags: initial.tags?.join(', ') ?? '',
	});
	const [notice, setNotice] = useState<Notice | null>(null);
	const [busy, setBusy] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const update = (field: keyof typeof data, value: string) => setData((current) => ({ ...current, [field]: value }));
	const derivedSlug = useMemo(() => slugify(data.title), [data.title]);
	const targetLocale = data.locale === 'es' ? 'en' : 'es';
	const closeNotice = useCallback(() => setNotice(null), []);

	const showNotice = (next: Notice) => setNotice(next);

	const readError = async (response: Response): Promise<Notice> => {
		try {
			const result = (await response.json()) as { error?: string; detail?: string };
			return {
				tone: 'error',
				title: result.error ?? 'No se pudo completar la acción.',
				detail: result.detail ?? JSON.stringify(result, null, 2),
			};
		} catch {
			return { tone: 'error', title: 'No se pudo completar la acción.' };
		}
	};

	const save = async (event?: { preventDefault: () => void }) => {
		event?.preventDefault();
		setBusy(true);
		setNotice(null);
		const response = await fetch(initial.id ? `/api/admin/posts/${initial.id}` : '/api/admin/posts', {
			method: initial.id ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...data,
				slug: data.slug || derivedSlug,
				tags: data.tags
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean),
			}),
		});
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setBusy(false);
		showNotice({ tone: 'success', title: 'Artículo guardado.' });
		if (!initial.id && result.id) location.href = `/admin/posts/${result.id}`;
		else if (!initial.id) location.href = '/admin/posts';
	};

	const translate = async () => {
		if (!initial.id) {
			showNotice({ tone: 'info', title: 'Guarda el artículo antes de traducir.' });
			return;
		}
		setBusy(true);
		showNotice({ tone: 'info', title: `Traduciendo a ${targetLocale.toUpperCase()} con gpt-4o-mini…` });
		const response = await fetch(`/api/admin/posts/${initial.id}/translate`, { method: 'POST' });
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setBusy(false);
		showNotice({ tone: 'success', title: result.message ?? 'Traducción lista.' });
		if (result.id) location.href = `/admin/posts/${result.id}`;
	};

	const importWord = async () => {
		const file = fileRef.current?.files?.[0];
		if (!file) {
			showNotice({ tone: 'info', title: 'Selecciona un documento Word.' });
			return;
		}
		setBusy(true);
		showNotice({ tone: 'info', title: 'Analizando documento…' });
		const form = new FormData();
		form.set('document', file);
		const response = await fetch('/api/admin/import-word', { method: 'POST', body: form });
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setBusy(false);
		setData((current) => ({
			...current,
			...result,
			tags: Array.isArray(result.tags) ? result.tags.join(', ') : current.tags,
		}));
		showNotice({ tone: 'success', title: 'Borrador generado. Revísalo antes de publicar.' });
	};

	const remove = async () => {
		if (!initial.id || !confirm('¿Eliminar este artículo de forma permanente?')) return;
		setBusy(true);
		const response = await fetch(`/api/admin/posts/${initial.id}`, { method: 'DELETE' });
		if (response.ok) location.href = '/admin/posts';
		else {
			setBusy(false);
			showNotice(await readError(response));
		}
	};

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				void save();
			}
		};
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	});

	const field = 'min-h-11 w-full rounded-lg border border-black-stroke bg-white px-3 py-2';
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-primary-200 bg-primary-100 p-5">
				<div className="flex items-center gap-2 font-headline text-xl font-bold">
					<Sparkles className="text-primary" aria-hidden /> Importar con IA
				</div>
				<p className="mt-1 text-sm text-black/65">Sube un .docx; se completarán los campos sin publicar automáticamente.</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<input ref={fileRef} aria-label="Documento Word" type="file" accept=".doc,.docx" className="min-h-11 rounded-lg bg-white p-2" />
					<button type="button" onClick={importWord} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-black px-4 font-bold text-white disabled:opacity-50">
						<Upload size={18} aria-hidden /> Importar
					</button>
				</div>
			</section>
			<form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
				<div className="space-y-5 rounded-2xl border border-black/10 bg-white p-6">
					<label className="block font-bold">
						Título
						<input className={`${field} mt-2`} required minLength={3} maxLength={120} value={data.title} onChange={(e) => update('title', e.target.value)} />
					</label>
					<label className="block font-bold">
						Slug
						<input className={`${field} mt-2`} required minLength={3} value={data.slug || derivedSlug} onChange={(e) => update('slug', e.target.value)} />
					</label>
					<label className="block font-bold">
						Descripción <span className="font-normal text-black/50">{data.excerpt.trim().length}/20 mín.</span>
						<textarea className={`${field} mt-2 min-h-24`} required minLength={20} maxLength={320} value={data.excerpt} onChange={(e) => update('excerpt', e.target.value)} />
					</label>
					<label className="block font-bold">
						Contenido Markdown <span className="font-normal text-black/50">{data.markdown.trim().length}/20 mín.</span>
						<textarea className={`${field} mt-2 min-h-[28rem] font-mono text-sm`} required minLength={20} value={data.markdown} onChange={(e) => update('markdown', e.target.value)} />
					</label>
				</div>
				<aside className="space-y-5 rounded-2xl border border-black/10 bg-white p-6">
					<label className="block font-bold">
						Idioma
						<select className={`${field} mt-2`} value={data.locale} onChange={(e) => update('locale', e.target.value)} disabled={Boolean(initial.id)}>
							<option value="es">Español</option>
							<option value="en">English</option>
						</select>
					</label>
					<label className="block font-bold">
						Estado
						<select className={`${field} mt-2`} value={data.status} onChange={(e) => update('status', e.target.value)}>
							<option value="draft">Borrador</option>
							<option value="published">Publicado</option>
						</select>
					</label>
					<label className="block font-bold">
						Etiquetas
						<input className={`${field} mt-2`} placeholder="Diseño, IA" value={data.tags} onChange={(e) => update('tags', e.target.value)} />
					</label>
					<label className="block font-bold">
						Título SEO <span className="font-normal text-black/50">{data.seoTitle.length}/60</span>
						<input className={`${field} mt-2`} required minLength={3} maxLength={60} value={data.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} />
					</label>
					<label className="block font-bold">
						Descripción SEO <span className="font-normal text-black/50">{data.seoDescription.length}/160</span>
						<textarea className={`${field} mt-2 min-h-28`} required minLength={20} maxLength={160} value={data.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} />
					</label>
					<label className="block font-bold">
						URL de portada
						<input className={`${field} mt-2`} type="url" value={data.coverUrl} onChange={(e) => update('coverUrl', e.target.value)} />
					</label>
					<label className="block font-bold">
						Texto alternativo
						<input className={`${field} mt-2`} value={data.coverAlt} onChange={(e) => update('coverAlt', e.target.value)} />
					</label>
					<button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-bold text-white hover:bg-primary-700 disabled:opacity-50">
						<Save size={18} aria-hidden /> {busy ? 'Guardando…' : 'Guardar'}
					</button>
					{initial.id && (
						<button type="button" onClick={translate} disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-5 font-bold text-primary-800 hover:bg-primary-100 disabled:opacity-50">
							<Languages size={18} aria-hidden /> Traducir a {targetLocale.toUpperCase()}
						</button>
					)}
					{initial.id && (
						<button type="button" onClick={remove} disabled={busy} className="min-h-11 w-full rounded-lg border border-error-700 px-4 font-bold text-error-700 hover:bg-error-100">
							Eliminar artículo
						</button>
					)}
				</aside>
			</form>
			<Toast
				open={Boolean(notice)}
				tone={notice?.tone}
				title={notice?.title ?? ''}
				detail={notice?.detail}
				onClose={closeNotice}
				autoHideMs={notice?.tone === 'success' ? 4000 : undefined}
			/>
		</div>
	);
}
