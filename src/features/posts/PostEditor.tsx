import { ExternalLink, Eye, Languages, Save, Sparkles, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast, type ToastTone } from '../../components/blog/molecules/Toast';
import type { ImagePart, ImageProgressEvent } from './image-progress';
import { keywordsForSave } from './keyword-save';

type ImageStage = { phase: 'waiting' | 'generating' | 'uploading' | 'uploaded' | 'saved' | 'interrupted'; percentage?: number };

type Initial = {
	id?: string;
	updatedAt?: string;
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
	categoryId?: string | null;
	hasSibling?: boolean;
	editorial?: { coverCaption: string; coverPrompt: string; bodyAlt: string; bodyCaption: string; bodyPrompt: string; approvedAt: string | null; bodyImageUrl: string | null } | null;
};

type Notice = {
	tone: ToastTone;
	title: string;
	detail?: string | null;
};

const slugify = (value: string) =>
	value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type CategoryOption = { id: string; name: string };
type TagOption = { id: string; name: string; nameEn: string | null };

export function PostEditor({ initial = {}, categories = [], tagOptions = [] }: { initial?: Initial; categories?: CategoryOption[]; tagOptions?: TagOption[] }) {
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
		categoryId: initial.categoryId ?? '',
	});
	const [notice, setNotice] = useState<Notice | null>(null);
	const [busy, setBusy] = useState(false);
	const [brief, setBrief] = useState('');
	const [tagSearch, setTagSearch] = useState('');
	const [approved, setApproved] = useState(Boolean(initial.editorial?.approvedAt));
	const [dirty, setDirty] = useState(false);
	const [savedRevision, setSavedRevision] = useState(initial.updatedAt ?? '');
	// Last saved status/slug: the public link must point at what is actually live, not at unsaved edits.
	const [savedStatus, setSavedStatus] = useState(initial.status ?? 'draft');
	const [savedSlug, setSavedSlug] = useState(initial.slug ?? '');
	const [images, setImages] = useState({ coverUrl: initial.coverUrl ?? '', bodyImageUrl: initial.editorial?.bodyImageUrl ?? '' });
	const [bodyAspect, setBodyAspect] = useState<'9:16' | '3:2'>('9:16');
	const [imageProgress, setImageProgress] = useState<Record<ImagePart, ImageStage> | null>(null);
	const [savingImages, setSavingImages] = useState(false);
	const [editorial, setEditorial] = useState(initial.editorial ? { coverCaption: initial.editorial.coverCaption, coverPrompt: initial.editorial.coverPrompt, bodyAlt: initial.editorial.bodyAlt, bodyCaption: initial.editorial.bodyCaption, bodyPrompt: initial.editorial.bodyPrompt } : null);
	const fileRef = useRef<HTMLInputElement>(null);
	const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		try { return await fetch(input, init); }
		catch { return Response.json({ error: 'No hay conexión. Revisa tu red e inténtalo de nuevo.' }, { status: 503 }); }
	};

	const update = (field: keyof typeof data, value: string) => { setDirty(true); setApproved(false); setData((current) => ({ ...current, [field]: value })); };
	const selectedTags = data.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
	const tagKey = (value: string) => value.trim().toLocaleLowerCase();
	const availableTags = tagOptions.map((tag) => ({ ...tag, label: data.locale === 'en' && tag.nameEn ? tag.nameEn : tag.name }))
		.filter((tag) => !selectedTags.some((selected) => tagKey(selected) === tagKey(tag.label)))
		.filter((tag) => !tagSearch.trim() || tagKey(`${tag.name} ${tag.nameEn ?? ''}`).includes(tagKey(tagSearch)));
	const addTag = (name: string) => {
		const value = name.trim();
		if (value.length < 2 || value.length > 50 || value.includes(',') || selectedTags.length >= 8 || selectedTags.some((tag) => tagKey(tag) === tagKey(value))) return;
		update('tags', [...selectedTags, value].join(', '));
		setTagSearch('');
	};
	const search = tagSearch.trim();
	const matchesExistingTag = tagOptions.some((tag) => [tag.name, tag.nameEn].some((name) => name && tagKey(name) === tagKey(search))) || selectedTags.some((tag) => tagKey(tag) === tagKey(search));
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
		let keywords: string[];
		try {
			keywords = keywordsForSave(selectedTags, tagSearch, tagOptions, data.locale);
		} catch (error) {
			showNotice({ tone: 'error', title: error instanceof Error ? error.message : 'Revisa la palabra clave pendiente.' });
			return;
		}
		setBusy(true);
		setNotice(null);
		const response = await safeFetch(initial.id ? `/api/admin/posts/${initial.id}` : '/api/admin/posts', {
			method: initial.id ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...data,
				...(editorial ? { editorial } : {}),
				slug: data.slug || derivedSlug,
				categoryId: data.categoryId || null,
				tags: keywords,
			}),
		});
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setBusy(false);
		setData((current) => ({ ...current, tags: keywords.join(', ') }));
		setTagSearch('');
		if (result.updatedAt) setSavedRevision(result.updatedAt);
		setSavedStatus(data.status);
		setSavedSlug(data.slug || derivedSlug);
		setDirty(false);
		if (initial.editorial) setApproved(false);
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
		const response = await safeFetch(`/api/admin/posts/${initial.id}/translate`, { method: 'POST' });
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

	const classify = async () => {
		if (!initial.id || dirty) {
			showNotice({ tone: 'info', title: 'Guarda los cambios antes de pedir la categoría y las palabras clave.' });
			return;
		}
		if (!confirm('La IA asignará la categoría y las palabras clave a todas las versiones de este artículo y reemplazará las actuales. ¿Continuar?')) return;
		setBusy(true);
		showNotice({ tone: 'info', title: 'Asignando categoría y palabras clave con gpt-4o-mini…' });
		const response = await safeFetch(`/api/admin/posts/${initial.id}/classify`, { method: 'POST' });
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		location.reload();
	};

	const importWord = async () => {
		const file = fileRef.current?.files?.[0];
		if (!file) {
			showNotice({ tone: 'info', title: 'Selecciona un documento Word.' });
			return;
		}
		if ((data.title || data.markdown || data.excerpt) && !confirm('La importación reemplazará los campos actuales del editor. ¿Deseas continuar?')) return;
		setBusy(true);
		showNotice({ tone: 'info', title: 'Analizando documento…' });
		const form = new FormData();
		form.set('document', file);
		form.set('locale', data.locale);
		const response = await safeFetch('/api/admin/import-word', { method: 'POST', body: form });
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
		setDirty(true); setApproved(false);
		showNotice({ tone: 'success', title: 'Contenido importado. Revisa los campos y guarda el borrador.' });
	};

	const generate = async () => {
		if (brief.trim().length < 10) {
			showNotice({ tone: 'info', title: 'Describe el artículo con al menos 10 caracteres.' });
			return;
		}
		if ((data.title || data.markdown || data.excerpt) && !confirm('Se abrirá un nuevo borrador y los cambios sin guardar de este editor se perderán. ¿Deseas continuar?')) return;
		setBusy(true);
		showNotice({ tone: 'info', title: 'Generando y guardando el borrador…' });
		const response = await safeFetch('/api/admin/posts/generate', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ brief, locale: data.locale }),
		});
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		location.href = `/admin/posts/${result.id}`;
	};

	const approve = async () => {
		if (!initial.id) return;
		setBusy(true);
		const response = await safeFetch(`/api/admin/posts/${initial.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updatedAt: savedRevision }) });
		setBusy(false);
		if (!response.ok) { showNotice(await readError(response)); return; }
		setApproved(true); showNotice({ tone: 'success', title: 'Contenido guardado aceptado. Ya puedes preparar las imágenes.' });
	};
	const generateImages = async () => {
		if (!initial.id) return;
		setBusy(true); setSavingImages(false);
		setImageProgress({ cover: { phase: 'waiting' }, body: { phase: 'waiting' } });
		showNotice({ tone: 'info', title: 'Generando dos imágenes; esto puede tardar.' });
		try {
			const response = await safeFetch(`/api/admin/posts/${initial.id}/images`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bodyAspect }) });
			if (!response.ok) { setImageProgress(null); showNotice(await readError(response)); return; }
			if (!response.body) throw new Error('No se pudo recibir el progreso.');
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let pending = '';
			let completed = false;
			const processLine = (line: string) => {
				if (!line.trim()) return;
				const event = JSON.parse(line) as ImageProgressEvent;
				if (event.type === 'error') throw new Error(event.message);
				if (event.type === 'generating') setImageProgress((current) => current && ({ ...current, [event.image]: { phase: 'generating' } }));
				if (event.type === 'uploading') setImageProgress((current) => current && ({ ...current, [event.image]: { phase: 'uploading', percentage: event.percentage } }));
				if (event.type === 'uploaded') setImageProgress((current) => current && ({ ...current, [event.image]: { phase: 'uploaded', percentage: 100 } }));
				if (event.type === 'saving') setSavingImages(true);
				if (event.type === 'complete') {
					completed = true;
					setImages({ coverUrl: event.coverUrl, bodyImageUrl: event.bodyImageUrl });
					setData((current) => ({ ...current, coverUrl: event.coverUrl }));
					setImageProgress({ cover: { phase: 'saved' }, body: { phase: 'saved' } });
					setSavingImages(false);
					showNotice({ tone: 'success', title: 'Imágenes generadas y guardadas.' });
				}
			};
			while (true) {
				const chunk = await reader.read();
				pending += decoder.decode(chunk.value, { stream: !chunk.done });
				const lines = pending.split('\n'); pending = lines.pop() ?? '';
				for (const line of lines) processLine(line);
				if (chunk.done) { if (pending.trim()) processLine(pending); break; }
			}
			if (!completed) throw new Error('Se perdió la conexión. Actualiza el artículo y revisa si se guardaron las imágenes antes de reintentar.');
		} catch (error) {
			setSavingImages(false);
			setImageProgress((current) => current && ({ cover: { phase: 'interrupted' }, body: { phase: 'interrupted' } }));
			showNotice({ tone: 'error', title: error instanceof Error ? error.message : 'No se pudo recibir el progreso.' });
		} finally { setBusy(false); }
	};
	const uploadImages = async () => {
		if (!initial.id) return;
		setBusy(true); showNotice({ tone: 'info', title: 'Guardando imágenes en Vercel Blob…' });
		const response = await safeFetch(`/api/admin/posts/${initial.id}/upload-images`, { method: 'POST' });
		setBusy(false);
		if (!response.ok) { showNotice(await readError(response)); return; }
		const result = await response.json();
		setImages(result); setData((current) => ({ ...current, coverUrl: result.coverUrl }));
		showNotice({ tone: 'success', title: 'Imágenes guardadas en Vercel Blob.' });
	};

	const remove = async () => {
		if (!initial.id || !confirm('¿Eliminar este artículo de forma permanente?')) return;
		setBusy(true);
		const response = await safeFetch(`/api/admin/posts/${initial.id}`, { method: 'DELETE' });
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
			{!initial.id && <section className="rounded-2xl border border-primary-200 bg-primary-100 p-5">
				<h2 className="font-headline text-xl font-bold">Crear borrador con IA</h2>
				<p className="mt-1 text-sm text-black/65">Describe el tema y el enfoque. El borrador se guardará en el idioma seleccionado para revisarlo antes de publicar.</p>
				<label className="mt-4 block font-bold">Instrucciones
					<textarea className={`${field} mt-2 min-h-24`} maxLength={4000} value={brief} onChange={(event) => setBrief(event.target.value)} />
				</label>
				<button type="button" onClick={generate} disabled={busy} className="mt-4 min-h-11 rounded-lg bg-black px-4 font-bold text-white disabled:opacity-50">Generar borrador</button>
			</section>}
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
						Categoría
						<select className={`${field} mt-2`} value={data.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
							<option value="">Sin categoría</option>
							{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
						</select>
						<span className="mt-1 block text-sm font-normal text-black/60">Sector del negocio. Se comparte entre los dos idiomas.</span>
					</label>
					<fieldset className="min-w-0">
						<legend className="font-bold">Palabras clave</legend>
						<p id="tag-help" className="mt-1 text-sm text-black/60">Selecciona temas o crea una palabra clave nueva. Al guardar también se agregará el texto escrito aquí. Máximo 8.</p>
						<div className="mt-3 flex flex-wrap gap-2" aria-label="Palabras clave seleccionadas">
							{selectedTags.length === 0 && <span className="text-sm text-black/60">Aún no hay palabras clave seleccionadas.</span>}
							{selectedTags.map((tag, index) => <span key={`${tag}-${index}`} className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1 text-sm font-semibold">{tag}<button type="button" aria-label={`Quitar ${tag}`} onClick={() => update('tags', selectedTags.filter((_, i) => i !== index).join(', '))} className="rounded px-1 text-primary-800 hover:bg-primary-200">×</button></span>)}
						</div>
						<label htmlFor="tag-search" className="mt-3 block text-sm font-bold">Buscar o crear palabra clave</label>
						<input id="tag-search" className={`${field} mt-1`} placeholder="Ej. fidelización" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const exact = availableTags.find((tag) => [tag.name, tag.nameEn].some((name) => name && tagKey(name) === tagKey(search))); if (exact) addTag(exact.label); else if (!matchesExistingTag) addTag(search); } }} maxLength={50} aria-describedby="tag-help" />
						{selectedTags.length >= 8 && <p className="mt-2 text-sm text-black/60">Ya seleccionaste 8 palabras clave. Quita una para agregar otra.</p>}
						{availableTags.length > 0 && <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-black/10 bg-white" aria-label="Palabras clave disponibles">{availableTags.map((tag) => <li key={tag.id}><button type="button" disabled={selectedTags.length >= 8} onClick={() => addTag(tag.label)} className="min-h-11 w-full px-3 text-left text-sm hover:bg-primary-100 disabled:opacity-50">+ {tag.label}</button></li>)}</ul>}
						{search.length >= 2 && !search.includes(',') && !matchesExistingTag && <button type="button" disabled={selectedTags.length >= 8} onClick={() => addTag(search)} className="mt-2 min-h-11 rounded-lg border border-primary-700 px-3 text-sm font-bold text-primary-800 disabled:opacity-50">Crear «{search}»</button>}
						{search.includes(',') && <p className="mt-2 text-sm text-error-700">Agrega una palabra clave a la vez, sin comas.</p>}
					</fieldset>
					{initial.id && (
						<button type="button" onClick={classify} disabled={busy || dirty} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-4 font-bold text-primary-800 hover:bg-primary-100 disabled:opacity-50">
							<Sparkles size={18} aria-hidden /> Sugerir categoría y palabras clave con IA
						</button>
					)}
					<label className="block font-bold">
						Título SEO <span className="font-normal text-black/50">{data.seoTitle.length} caracteres</span>
						<input className={`${field} mt-2`} required minLength={3} value={data.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} />
						<span className="mt-1 block text-sm font-normal text-black/60">Google puede acortar lo que muestra según el espacio disponible.</span>
					</label>
					<label className="block font-bold">
						Descripción SEO <span className="font-normal text-black/50">{data.seoDescription.length} caracteres</span>
						<textarea className={`${field} mt-2 min-h-28`} required minLength={20} value={data.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} />
						<span className="mt-1 block text-sm font-normal text-black/60">Google puede mostrar solo un fragmento; el texto completo se conserva.</span>
					</label>
					<label className="block font-bold">
						URL de portada
						<input className={`${field} mt-2`} value={data.coverUrl} onChange={(e) => update('coverUrl', e.target.value)} />
					</label>
					<label className="block font-bold">
						Texto alternativo
						<input className={`${field} mt-2`} value={data.coverAlt} onChange={(e) => update('coverAlt', e.target.value)} />
					</label>
					<button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-bold text-white hover:bg-primary-700 disabled:opacity-50">
						<Save size={18} aria-hidden /> {busy ? 'Guardando…' : 'Guardar'}
					</button>
					{initial.id && (
						<div className="space-y-2">
							<a href={`/admin/posts/${initial.id}/preview`} target="_blank" rel="noopener" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-5 font-bold text-primary-800 hover:bg-primary-100">
								<Eye size={18} aria-hidden /> Vista previa
							</a>
							{savedStatus === 'published' && (
								<a href={`/${data.locale}/blogs/${savedSlug}`} target="_blank" rel="noopener" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-black/30 bg-white px-5 font-bold hover:bg-black/5">
									<ExternalLink size={18} aria-hidden /> Ver página publicada
								</a>
							)}
							{dirty && <p className="text-sm text-black/65">La vista previa muestra la última versión guardada. Guarda para ver tus cambios.</p>}
						</div>
					)}
					{initial.id && !initial.hasSibling && (
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
			{initial.id && initial.editorial && <section className="rounded-2xl border border-primary-200 bg-white p-6">
				<h2 className="font-headline text-xl font-bold">Revisión de imágenes</h2>
				<p className="mt-2">Guarda los cambios antes de aceptar el contenido. Los prompts permanecen privados.</p>
				{editorial && (Object.entries({ coverCaption: 'Pie de portada', coverPrompt: 'Prompt privado de portada', bodyAlt: 'Texto alternativo interior', bodyCaption: 'Pie interior', bodyPrompt: 'Prompt privado interior' }) as [keyof typeof editorial, string][]).map(([field, label]) => <label key={field} className="mt-3 block font-bold">{label}<textarea className={`${field === 'bodyPrompt' ? 'min-h-24' : 'min-h-16'} mt-1 w-full rounded-lg border border-black/30 p-2 font-normal`} value={editorial[field]} onChange={(event) => { setDirty(true); setApproved(false); setEditorial({ ...editorial, [field]: event.target.value }); }} /></label>)}
				<button type="button" disabled={busy || approved || dirty || data.status !== 'draft'} onClick={approve} className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50">{approved ? 'Contenido aceptado' : 'Aceptar contenido guardado'}</button>
				{dirty && <p className="mt-2">Guarda los cambios para aceptar el contenido.</p>}
				{approved && <div className="mt-4 space-y-3">
					<p>Generar crea dos imágenes con OpenAI y consume créditos. Se guardan en Vercel Blob y pueden verse por cualquier persona que tenga su enlace, incluso mientras el artículo sea borrador.</p>
					{images.coverUrl.startsWith('/blog-generated/') && images.bodyImageUrl.startsWith('/blog-generated/') && <button type="button" disabled={busy || dirty} onClick={uploadImages} className="min-h-11 rounded-lg border border-primary-700 px-4 font-bold text-primary-800 disabled:opacity-50">Subir imágenes locales a Blob sin regenerar</button>}
					<label className="block font-bold">Formato de imagen interior <select value={bodyAspect} onChange={(event) => setBodyAspect(event.target.value as '9:16' | '3:2')} className="ml-2 rounded-lg border border-black/30 p-2"><option value="9:16">Vertical 9:16</option><option value="3:2">Horizontal 3:2</option></select></label>
					<button type="button" disabled={busy || dirty} onClick={generateImages} className="min-h-11 rounded-lg border border-primary-700 px-4 font-bold text-primary-800 disabled:opacity-50">{images.coverUrl || images.bodyImageUrl ? 'Regenerar ambas imágenes' : 'Generar portada e imagen interior'}</button>
					{(images.coverUrl || images.bodyImageUrl) && <p className="text-sm">Regenerar crea y cobra dos imágenes nuevas; las anteriores se conservan en la biblioteca de medios.</p>}
					{imageProgress && <div aria-live="polite" className="space-y-3 rounded-lg border border-primary-200 p-4">
						{(['cover', 'body'] as const).map((part) => {
							const state = imageProgress[part];
							const label = part === 'cover' ? 'Portada' : 'Imagen interior';
							const status = state.phase === 'waiting' ? 'Esperando' : state.phase === 'generating' ? 'Generando imagen' : state.phase === 'uploading' ? `Subiendo a Blob: ${state.percentage ?? 0} %` : state.phase === 'uploaded' ? 'Subida; pendiente de guardar' : state.phase === 'saved' ? 'Guardada' : 'Proceso interrumpido; revisa el artículo antes de reintentar';
							return <div key={part}><p><strong>{label}:</strong> {status}</p>{state.phase === 'uploading' && <progress className="w-full" max={100} value={state.percentage ?? 0} aria-label={`Subida de ${label}`} />}</div>;
						})}
						{savingImages && <p>Guardando las imágenes en el artículo…</p>}
					</div>}
					{images.coverUrl && <img src={images.coverUrl} alt="Vista previa de portada" className="max-w-md rounded-lg" />}
					{images.bodyImageUrl && <img src={images.bodyImageUrl} alt="Vista previa de imagen interior" className="max-w-md rounded-lg" />}
				</div>}
			</section>}
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
