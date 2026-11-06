import { ExternalLink, Eye, Languages, Save, Sparkles, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast, type ToastTone } from '../../components/blog/molecules/Toast';
import type { AdminCopy } from '../../i18n/locales/es/admin';
import { fillAdmin } from '../../i18n/ui';
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
	editorial?: {
		coverCaption: string;
		coverPrompt: string;
		bodyAlt: string;
		bodyCaption: string;
		bodyPrompt: string;
		approvedAt: string | null;
		bodyImageUrl: string | null;
	} | null;
};

type Notice = {
	tone: ToastTone;
	title: string;
	detail?: string | null;
};

type CategoryOption = { id: string; name: string };
type TagOption = { id: string; name: string; nameEn: string | null };

type EditorCopy = AdminCopy['editor'];

const slugify = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const fill = fillAdmin;

export function PostEditor({
	initial = {},
	categories = [],
	tagOptions = [],
	copy,
}: {
	initial?: Initial;
	categories?: CategoryOption[];
	tagOptions?: TagOption[];
	copy: EditorCopy;
}) {
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
	const [savedStatus, setSavedStatus] = useState(initial.status ?? 'draft');
	const [savedSlug, setSavedSlug] = useState(initial.slug ?? '');
	const [images, setImages] = useState({
		coverUrl: initial.coverUrl ?? '',
		bodyImageUrl: initial.editorial?.bodyImageUrl ?? '',
	});
	const [bodyAspect, setBodyAspect] = useState<'9:16' | '3:2'>('9:16');
	const [imageProgress, setImageProgress] = useState<Record<ImagePart, ImageStage> | null>(null);
	const [savingImages, setSavingImages] = useState(false);
	const [editorial, setEditorial] = useState(
		initial.editorial
			? {
					coverCaption: initial.editorial.coverCaption,
					coverPrompt: initial.editorial.coverPrompt,
					bodyAlt: initial.editorial.bodyAlt,
					bodyCaption: initial.editorial.bodyCaption,
					bodyPrompt: initial.editorial.bodyPrompt,
				}
			: null,
	);
	const fileRef = useRef<HTMLInputElement>(null);
	const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		try {
			return await fetch(input, init);
		} catch {
			return Response.json({ error: copy.networkError }, { status: 503 });
		}
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
				title: result.error ?? copy.actionFailed,
				detail: result.detail ?? JSON.stringify(result, null, 2),
			};
		} catch {
			return { tone: 'error', title: copy.actionFailed };
		}
	};

	const save = async (event?: { preventDefault: () => void }) => {
		event?.preventDefault();
		let keywords: string[];
		try {
			keywords = keywordsForSave(selectedTags, tagSearch, tagOptions, data.locale);
		} catch {
			showNotice({ tone: 'error', title: copy.keywordInvalid });
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
		showNotice({ tone: 'success', title: copy.saved });
		if (!initial.id && result.id) location.href = `/admin/posts/${result.id}`;
		else if (!initial.id) location.href = '/admin/posts';
	};

	const translate = async () => {
		if (!initial.id) {
			showNotice({ tone: 'info', title: copy.saveBeforeTranslate });
			return;
		}
		setBusy(true);
		showNotice({
			tone: 'info',
			title: fill(copy.translating, { locale: targetLocale.toUpperCase() }),
		});
		const response = await safeFetch(`/api/admin/posts/${initial.id}/translate`, { method: 'POST' });
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setBusy(false);
		showNotice({ tone: 'success', title: result.message ?? copy.translateDone });
		if (result.id) location.href = `/admin/posts/${result.id}`;
	};

	const classify = async () => {
		if (!initial.id || dirty) {
			showNotice({ tone: 'info', title: copy.saveBeforeClassify });
			return;
		}
		if (!confirm(copy.confirmClassify)) return;
		setBusy(true);
		showNotice({ tone: 'info', title: copy.classifying });
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
			showNotice({ tone: 'info', title: copy.selectWord });
			return;
		}
		if ((data.title || data.markdown || data.excerpt) && !confirm(copy.confirmImport)) return;
		setBusy(true);
		showNotice({ tone: 'info', title: copy.analyzingDoc });
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
		setDirty(true);
		setApproved(false);
		showNotice({ tone: 'success', title: copy.imported });
	};

	const generate = async () => {
		if (brief.trim().length < 10) {
			showNotice({ tone: 'info', title: copy.briefTooShort });
			return;
		}
		if ((data.title || data.markdown || data.excerpt) && !confirm(copy.confirmGenerate)) return;
		setBusy(true);
		showNotice({ tone: 'info', title: copy.generatingDraft });
		const response = await safeFetch('/api/admin/posts/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
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
		const response = await safeFetch(`/api/admin/posts/${initial.id}/approve`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ updatedAt: savedRevision }),
		});
		setBusy(false);
		if (!response.ok) {
			showNotice(await readError(response));
			return;
		}
		setApproved(true);
		showNotice({ tone: 'success', title: copy.approvedOk });
	};

	const generateImages = async () => {
		if (!initial.id) return;
		setBusy(true);
		setSavingImages(false);
		setImageProgress({ cover: { phase: 'waiting' }, body: { phase: 'waiting' } });
		showNotice({ tone: 'info', title: copy.generatingImages });
		try {
			const response = await safeFetch(`/api/admin/posts/${initial.id}/images`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bodyAspect }),
			});
			if (!response.ok) {
				setImageProgress(null);
				showNotice(await readError(response));
				return;
			}
			if (!response.body) throw new Error(copy.progressFailed);
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let pending = '';
			let completed = false;
			const processLine = (line: string) => {
				if (!line.trim()) return;
				const event = JSON.parse(line) as ImageProgressEvent;
				if (event.type === 'error') throw new Error(event.message);
				if (event.type === 'generating')
					setImageProgress((current) => current && { ...current, [event.image]: { phase: 'generating' } });
				if (event.type === 'uploading')
					setImageProgress(
						(current) =>
							current && { ...current, [event.image]: { phase: 'uploading', percentage: event.percentage } },
					);
				if (event.type === 'uploaded')
					setImageProgress(
						(current) => current && { ...current, [event.image]: { phase: 'uploaded', percentage: 100 } },
					);
				if (event.type === 'saving') setSavingImages(true);
				if (event.type === 'complete') {
					completed = true;
					setImages({ coverUrl: event.coverUrl, bodyImageUrl: event.bodyImageUrl });
					setData((current) => ({ ...current, coverUrl: event.coverUrl }));
					setImageProgress({ cover: { phase: 'saved' }, body: { phase: 'saved' } });
					setSavingImages(false);
					showNotice({ tone: 'success', title: copy.imagesSaved });
				}
			};
			while (true) {
				const chunk = await reader.read();
				pending += decoder.decode(chunk.value, { stream: !chunk.done });
				const lines = pending.split('\n');
				pending = lines.pop() ?? '';
				for (const line of lines) processLine(line);
				if (chunk.done) {
					if (pending.trim()) processLine(pending);
					break;
				}
			}
			if (!completed) throw new Error(copy.connectionLost);
		} catch (error) {
			setSavingImages(false);
			setImageProgress((current) => current && { cover: { phase: 'interrupted' }, body: { phase: 'interrupted' } });
			showNotice({
				tone: 'error',
				title: error instanceof Error ? error.message : copy.progressFailed,
			});
		} finally {
			setBusy(false);
		}
	};

	const uploadImages = async () => {
		if (!initial.id) return;
		setBusy(true);
		showNotice({ tone: 'info', title: copy.uploadingBlob });
		const response = await safeFetch(`/api/admin/posts/${initial.id}/upload-images`, { method: 'POST' });
		setBusy(false);
		if (!response.ok) {
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setImages(result);
		setData((current) => ({ ...current, coverUrl: result.coverUrl }));
		showNotice({ tone: 'success', title: copy.blobSaved });
	};

	const remove = async () => {
		if (!initial.id || !confirm(copy.confirmDelete)) return;
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

	const phaseLabel = (state: ImageStage) => {
		if (state.phase === 'waiting') return copy.phaseWaiting;
		if (state.phase === 'generating') return copy.phaseGenerating;
		if (state.phase === 'uploading') return fill(copy.phaseUploading, { percentage: state.percentage ?? 0 });
		if (state.phase === 'uploaded') return copy.phaseUploaded;
		if (state.phase === 'saved') return copy.phaseSaved;
		return copy.phaseInterrupted;
	};

	const field = 'min-h-11 w-full rounded-lg border border-black-stroke bg-white px-3 py-2';
	const editorialFields = editorial
		? ([
				['coverCaption', copy.coverCaption],
				['coverPrompt', copy.coverPrompt],
				['bodyAlt', copy.bodyAlt],
				['bodyCaption', copy.bodyCaption],
				['bodyPrompt', copy.bodyPrompt],
			] as const)
		: [];

	return (
		<div className="space-y-6">
			{!initial.id && (
				<section className="rounded-2xl border border-primary-200 bg-primary-100 p-5">
					<h2 className="font-headline text-xl font-bold">{copy.aiDraftTitle}</h2>
					<p className="mt-1 text-sm text-black/65">{copy.aiDraftDesc}</p>
					<label className="mt-4 block font-bold">
						{copy.aiDraftInstructions}
						<textarea
							className={`${field} mt-2 min-h-24`}
							maxLength={4000}
							value={brief}
							onChange={(event) => setBrief(event.target.value)}
						/>
					</label>
					<button
						type="button"
						onClick={generate}
						disabled={busy}
						className="mt-4 min-h-11 rounded-lg bg-black px-4 font-bold text-white disabled:opacity-50"
					>
						{copy.aiDraftGenerate}
					</button>
				</section>
			)}
			<section className="rounded-2xl border border-primary-200 bg-primary-100 p-5">
				<div className="flex items-center gap-2 font-headline text-xl font-bold">
					<Sparkles className="text-primary" aria-hidden /> {copy.aiImportTitle}
				</div>
				<p className="mt-1 text-sm text-black/65">{copy.aiImportDesc}</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<input
						ref={fileRef}
						aria-label={copy.wordDocumentAria}
						type="file"
						accept=".doc,.docx"
						className="min-h-11 rounded-lg bg-white p-2"
					/>
					<button
						type="button"
						onClick={importWord}
						disabled={busy}
						className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-black px-4 font-bold text-white disabled:opacity-50"
					>
						<Upload size={18} aria-hidden /> {copy.import}
					</button>
				</div>
			</section>
			<form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
				<div className="space-y-5 rounded-2xl border border-black/10 bg-white p-6">
					<label className="block font-bold">
						{copy.title}
						<input
							className={`${field} mt-2`}
							required
							minLength={3}
							maxLength={120}
							value={data.title}
							onChange={(e) => update('title', e.target.value)}
						/>
					</label>
					<label className="block font-bold">
						{copy.slug}
						<input
							className={`${field} mt-2`}
							required
							minLength={3}
							value={data.slug || derivedSlug}
							onChange={(e) => update('slug', e.target.value)}
						/>
					</label>
					<label className="block font-bold">
						{copy.excerpt}{' '}
						<span className="font-normal text-black/50">
							{fill(copy.excerptMin, { count: data.excerpt.trim().length })}
						</span>
						<textarea
							className={`${field} mt-2 min-h-24`}
							required
							minLength={20}
							maxLength={320}
							value={data.excerpt}
							onChange={(e) => update('excerpt', e.target.value)}
						/>
					</label>
					<label className="block font-bold">
						{copy.markdown}{' '}
						<span className="font-normal text-black/50">
							{fill(copy.markdownMin, { count: data.markdown.trim().length })}
						</span>
						<textarea
							className={`${field} mt-2 min-h-[28rem] font-mono text-sm`}
							required
							minLength={20}
							value={data.markdown}
							onChange={(e) => update('markdown', e.target.value)}
						/>
					</label>
				</div>
				<aside className="space-y-5 rounded-2xl border border-black/10 bg-white p-6">
					<label className="block font-bold">
						{copy.language}
						<select
							className={`${field} mt-2`}
							value={data.locale}
							onChange={(e) => update('locale', e.target.value)}
							disabled={Boolean(initial.id)}
						>
							<option value="es">{copy.localeEs}</option>
							<option value="en">{copy.localeEn}</option>
						</select>
					</label>
					<label className="block font-bold">
						{copy.status}
						<select
							className={`${field} mt-2`}
							value={data.status}
							onChange={(e) => update('status', e.target.value)}
						>
							<option value="draft">{copy.statusDraft}</option>
							<option value="published">{copy.statusPublished}</option>
						</select>
					</label>
					<label className="block font-bold">
						{copy.category}
						<select
							className={`${field} mt-2`}
							value={data.categoryId}
							onChange={(e) => update('categoryId', e.target.value)}
						>
							<option value="">{copy.noCategory}</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
						<span className="mt-1 block text-sm font-normal text-black/60">{copy.categoryHint}</span>
					</label>
					<fieldset className="min-w-0">
						<legend className="font-bold">{copy.tags}</legend>
						<p id="tag-help" className="mt-1 text-sm text-black/60">{copy.tagsHint}</p>
						<div className="mt-3 flex flex-wrap gap-2" aria-label={copy.keywordsSelected}>
							{selectedTags.length === 0 && <span className="text-sm text-black/60">{copy.keywordsEmpty}</span>}
							{selectedTags.map((tag, index) => <span key={`${tag}-${index}`} className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1 text-sm font-semibold">{tag}<button type="button" aria-label={fill(copy.keywordRemove, { name: tag })} onClick={() => update('tags', selectedTags.filter((_, i) => i !== index).join(', '))} className="rounded px-1 text-primary-800 hover:bg-primary-200">×</button></span>)}
						</div>
						<label htmlFor="tag-search" className="mt-3 block text-sm font-bold">{copy.keywordSearch}</label>
						<input id="tag-search" className={`${field} mt-1`} placeholder={copy.tagsPlaceholder} value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const exact = availableTags.find((tag) => [tag.name, tag.nameEn].some((name) => name && tagKey(name) === tagKey(search))); if (exact) addTag(exact.label); else if (!matchesExistingTag) addTag(search); } }} maxLength={50} aria-describedby="tag-help" />
						{selectedTags.length >= 8 && <p className="mt-2 text-sm text-black/60">{copy.keywordsLimit}</p>}
						{availableTags.length > 0 && <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-black/10 bg-white" aria-label={copy.keywordsAvailable}>{availableTags.map((tag) => <li key={tag.id}><button type="button" disabled={selectedTags.length >= 8} onClick={() => addTag(tag.label)} className="min-h-11 w-full px-3 text-left text-sm hover:bg-primary-100 disabled:opacity-50">+ {tag.label}</button></li>)}</ul>}
						{search.length >= 2 && !search.includes(',') && !matchesExistingTag && <button type="button" disabled={selectedTags.length >= 8} onClick={() => addTag(search)} className="mt-2 min-h-11 rounded-lg border border-primary-700 px-3 text-sm font-bold text-primary-800 disabled:opacity-50">{fill(copy.keywordCreate, { name: search })}</button>}
						{search.includes(',') && <p className="mt-2 text-sm text-error-700">{copy.keywordComma}</p>}
					</fieldset>
					{initial.id && (
						<button type="button" onClick={classify} disabled={busy || dirty} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-4 font-bold text-primary-800 hover:bg-primary-100 disabled:opacity-50">
							<Sparkles size={18} aria-hidden /> {copy.suggestTaxonomy}
						</button>
					)}
					<label className="block font-bold">
						{copy.seoTitle}{' '}
						<span className="font-normal text-black/50">{fill(copy.chars, { count: data.seoTitle.length })}</span>
						<input
							className={`${field} mt-2`}
							required
							minLength={3}
							value={data.seoTitle}
							onChange={(e) => update('seoTitle', e.target.value)}
						/>
						<span className="mt-1 block text-sm font-normal text-black/60">{copy.seoTitleHint}</span>
					</label>
					<label className="block font-bold">
						{copy.seoDescription}{' '}
						<span className="font-normal text-black/50">
							{fill(copy.chars, { count: data.seoDescription.length })}
						</span>
						<textarea
							className={`${field} mt-2 min-h-28`}
							required
							minLength={20}
							value={data.seoDescription}
							onChange={(e) => update('seoDescription', e.target.value)}
						/>
						<span className="mt-1 block text-sm font-normal text-black/60">{copy.seoDescHint}</span>
					</label>
					<label className="block font-bold">
						{copy.coverUrl}
						<input
							className={`${field} mt-2`}
							value={data.coverUrl}
							onChange={(e) => update('coverUrl', e.target.value)}
						/>
					</label>
					<label className="block font-bold">
						{copy.coverAlt}
						<input
							className={`${field} mt-2`}
							value={data.coverAlt}
							onChange={(e) => update('coverAlt', e.target.value)}
						/>
					</label>
					<button
						disabled={busy}
						className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-bold text-white hover:bg-primary-700 disabled:opacity-50"
					>
						<Save size={18} aria-hidden /> {busy ? copy.saving : copy.save}
					</button>
					{initial.id && (
						<div className="space-y-2">
							<a
								href={`/admin/posts/${initial.id}/preview`}
								target="_blank"
								rel="noopener"
								className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-5 font-bold text-primary-800 hover:bg-primary-100"
							>
								<Eye size={18} aria-hidden /> {copy.preview}
							</a>
							{savedStatus === 'published' && (
								<a
									href={`/${data.locale}/blogs/${savedSlug}`}
									target="_blank"
									rel="noopener"
									className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-black/30 bg-white px-5 font-bold hover:bg-black/5"
								>
									<ExternalLink size={18} aria-hidden /> {copy.viewPublished}
								</a>
							)}
							{dirty && <p className="text-sm text-black/65">{copy.previewStale}</p>}
						</div>
					)}
					{initial.id && !initial.hasSibling && (
						<button
							type="button"
							onClick={translate}
							disabled={busy}
							className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-5 font-bold text-primary-800 hover:bg-primary-100 disabled:opacity-50"
						>
							<Languages size={18} aria-hidden />{' '}
							{fill(copy.translateTo, { locale: targetLocale.toUpperCase() })}
						</button>
					)}
					{initial.id && (
						<button
							type="button"
							onClick={remove}
							disabled={busy}
							className="min-h-11 w-full rounded-lg border border-error-700 px-4 font-bold text-error-700 hover:bg-error-100"
						>
							{copy.deleteArticle}
						</button>
					)}
				</aside>
			</form>
			{initial.id && initial.editorial && (
				<section className="rounded-2xl border border-primary-200 bg-white p-6">
					<h2 className="font-headline text-xl font-bold">{copy.imagesReview}</h2>
					<p className="mt-2">{copy.imagesReviewDesc}</p>
					{editorial &&
						editorialFields.map(([key, label]) => (
							<label key={key} className="mt-3 block font-bold">
								{label}
								<textarea
									className={`${key === 'bodyPrompt' ? 'min-h-24' : 'min-h-16'} mt-1 w-full rounded-lg border border-black/30 p-2 font-normal`}
									value={editorial[key]}
									onChange={(event) => {
										setDirty(true);
										setApproved(false);
										setEditorial({ ...editorial, [key]: event.target.value });
									}}
								/>
							</label>
						))}
					<button
						type="button"
						disabled={busy || approved || dirty || data.status !== 'draft'}
						onClick={approve}
						className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50"
					>
						{approved ? copy.contentAccepted : copy.acceptContent}
					</button>
					{dirty && <p className="mt-2">{copy.saveToAccept}</p>}
					{approved && (
						<div className="mt-4 space-y-3">
							<p>{copy.generateImagesWarn}</p>
							{images.coverUrl.startsWith('/blog-generated/') &&
								images.bodyImageUrl.startsWith('/blog-generated/') && (
									<button
										type="button"
										disabled={busy || dirty}
										onClick={uploadImages}
										className="min-h-11 rounded-lg border border-primary-700 px-4 font-bold text-primary-800 disabled:opacity-50"
									>
										{copy.uploadLocalBlob}
									</button>
								)}
							<label className="block font-bold">
								{copy.bodyAspect}{' '}
								<select
									value={bodyAspect}
									onChange={(event) => setBodyAspect(event.target.value as '9:16' | '3:2')}
									className="ml-2 rounded-lg border border-black/30 p-2"
								>
									<option value="9:16">{copy.aspectVertical}</option>
									<option value="3:2">{copy.aspectHorizontal}</option>
								</select>
							</label>
							<button
								type="button"
								disabled={busy || dirty}
								onClick={generateImages}
								className="min-h-11 rounded-lg border border-primary-700 px-4 font-bold text-primary-800 disabled:opacity-50"
							>
								{images.coverUrl || images.bodyImageUrl ? copy.regenerateBoth : copy.generateBoth}
							</button>
							{(images.coverUrl || images.bodyImageUrl) && (
								<p className="text-sm">{copy.regenerateNote}</p>
							)}
							{imageProgress && (
								<div aria-live="polite" className="space-y-3 rounded-lg border border-primary-200 p-4">
									{(['cover', 'body'] as const).map((part) => {
										const state = imageProgress[part];
										const label = part === 'cover' ? copy.labelCover : copy.labelBody;
										return (
											<div key={part}>
												<p>
													<strong>{label}:</strong> {phaseLabel(state)}
												</p>
												{state.phase === 'uploading' && (
													<progress
														className="w-full"
														max={100}
														value={state.percentage ?? 0}
														aria-label={fill(copy.uploadProgressAria, { label })}
													/>
												)}
											</div>
										);
									})}
									{savingImages && <p>{copy.savingImagesPost}</p>}
								</div>
							)}
							{images.coverUrl && (
								<img src={images.coverUrl} alt={copy.coverPreviewAlt} className="max-w-md rounded-lg" />
							)}
							{images.bodyImageUrl && (
								<img
									src={images.bodyImageUrl}
									alt={copy.bodyPreviewAlt}
									className="max-w-md rounded-lg"
								/>
							)}
						</div>
					)}
				</section>
			)}
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
