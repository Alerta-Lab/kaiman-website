import {
	Bold,
	ChevronDown,
	Code,
	Eye,
	Heading,
	Image as ImageIcon,
	Italic,
	Languages,
	Link2,
	List,
	ListOrdered,
	Quote,
	Save,
	Sparkles,
	Strikethrough,
	Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Toast, type ToastTone } from '../../components/blog/molecules/Toast';
import type { AdminCopy } from '../../i18n/locales/es/admin';
import { keywordsForSave } from './keyword-save';

type ContentLocale = 'es' | 'en';
type EditorCopy = AdminCopy['editor'];

type LocaleDraft = {
	id?: string;
	slug: string;
	title: string;
	excerpt: string;
	markdown: string;
	status: 'draft' | 'published';
	seoTitle: string;
	seoDescription: string;
	coverUrl: string;
	coverAlt: string;
	tags: string;
	updatedAt?: string;
};

type InitialVersion = Partial<LocaleDraft> & { locale: ContentLocale };

type CategoryOption = { id: string; name: string };
type TagOption = { id: string; name: string; nameEn: string | null };

type Notice = { tone: ToastTone; title: string; detail?: string | null };

const emptyDraft = (): LocaleDraft => ({
	slug: '',
	title: '',
	excerpt: '',
	markdown: '',
	status: 'draft',
	seoTitle: '',
	seoDescription: '',
	coverUrl: '',
	coverAlt: '',
	tags: '',
});

const slugify = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const labelClass = 'mb-1.5 block font-body text-sm font-normal text-black';
const hintClass = 'mt-1 block font-body text-xs font-normal text-black/70';
const helpClass = 'text-sm text-black/70';
const fieldClass =
	'min-h-11 w-full rounded-lg border border-black-stroke/30 bg-white px-3 py-2 font-body font-normal text-black outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30';
const selectClass = `${fieldClass} appearance-none pr-11`;

function SectionCard({
	number,
	title,
	children,
}: {
	number: number;
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
			<div className="mb-5 flex items-center gap-3">
				<span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-headline text-sm font-bold text-white">
					{number}
				</span>
				<h2 className="font-headline text-xl font-bold tracking-tight text-black">{title}</h2>
			</div>
			{children}
		</section>
	);
}

function insertMarkdown(
	ref: RefObject<HTMLTextAreaElement | null>,
	before: string,
	after = '',
	fallback = '',
	onChange: (value: string) => void,
) {
	const el = ref.current;
	if (!el) return;
	const start = el.selectionStart;
	const end = el.selectionEnd;
	const selected = el.value.slice(start, end) || fallback;
	const next = `${el.value.slice(0, start)}${before}${selected}${after}${el.value.slice(end)}`;
	onChange(next);
	requestAnimationFrame(() => {
		el.focus();
		const cursor = start + before.length + selected.length + after.length;
		el.setSelectionRange(cursor, cursor);
	});
}

export function PostEditor({
	copy,
	categories = [],
	tagOptions = [],
	mode = 'create',
	initialVersions = [],
	translationGroupId: initialGroupId,
	initialSlug = '',
	initialCategoryId = '',
	activeLocale: initialActive = 'es',
}: {
	copy: EditorCopy;
	categories?: CategoryOption[];
	tagOptions?: TagOption[];
	mode?: 'create' | 'edit';
	initialVersions?: InitialVersion[];
	translationGroupId?: string;
	initialSlug?: string;
	initialCategoryId?: string;
	activeLocale?: ContentLocale;
}) {
	const seed = (locale: ContentLocale): LocaleDraft => {
		const found = initialVersions.find((item) => item.locale === locale);
		if (!found) return emptyDraft();
		return {
			id: found.id,
			slug: found.slug ?? (locale === initialActive ? initialSlug : ''),
			title: found.title ?? '',
			excerpt: found.excerpt ?? '',
			markdown: found.markdown ?? '',
			status: found.status ?? 'draft',
			seoTitle: found.seoTitle ?? '',
			seoDescription: found.seoDescription ?? '',
			coverUrl: found.coverUrl ?? '',
			coverAlt: found.coverAlt ?? '',
			tags: found.tags ?? '',
			updatedAt: found.updatedAt,
		};
	};

	const [activeLocale, setActiveLocale] = useState<ContentLocale>(initialActive);
	const [versions, setVersions] = useState<Record<ContentLocale, LocaleDraft>>({
		es: seed('es'),
		en: seed('en'),
	});
	const [categoryId, setCategoryId] = useState(initialCategoryId);
	const [translationGroupId, setTranslationGroupId] = useState(initialGroupId);
	const [notice, setNotice] = useState<Notice | null>(null);
	const [busy, setBusy] = useState(false);
	const [idea, setIdea] = useState('');
	const [generatedDraft, setGeneratedDraft] = useState('');
	const [tagSearches, setTagSearches] = useState<Record<ContentLocale, string>>({ es: '', en: '' });
	const [dirtyLocales, setDirtyLocales] = useState<Record<ContentLocale, boolean>>({ es: false, en: false });
	const [categoryDirty, setCategoryDirty] = useState(false);
	const dirty = dirtyLocales.es || dirtyLocales.en || categoryDirty || Boolean(tagSearches.es.trim() || tagSearches.en.trim());
	const markdownRef = useRef<HTMLTextAreaElement>(null);

	const draft = versions[activeLocale];
	const otherLocale: ContentLocale = activeLocale === 'es' ? 'en' : 'es';
	const other = versions[otherLocale];
	const tagSearch = tagSearches[activeLocale];
	const selectedTags = draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
	const tagKey = (value: string) => value.trim().toLocaleLowerCase();
	const search = tagSearch.trim();
	const availableTags = tagOptions.map((tag) => ({ ...tag, label: activeLocale === 'en' && tag.nameEn ? tag.nameEn : tag.name }))
		.filter((tag) => !selectedTags.some((selected) => tagKey(selected) === tagKey(tag.label)))
		.filter((tag) => !search || tagKey(`${tag.name} ${tag.nameEn ?? ''}`).includes(tagKey(search)));
	const matchesExistingTag = tagOptions.some((tag) => [tag.name, tag.nameEn].some((name) => name && tagKey(name) === tagKey(search))) || selectedTags.some((tag) => tagKey(tag) === tagKey(search));
	const derivedSlug = useMemo(() => slugify(draft.title), [draft.title]);
	const effectiveSlug = draft.slug || derivedSlug;

	const showNotice = (next: Notice) => setNotice(next);
	const closeNotice = useCallback(() => setNotice(null), []);

	const updateActive = (patch: Partial<LocaleDraft>) => {
		setDirtyLocales((current) => ({ ...current, [activeLocale]: true }));
		setVersions((current) => ({
			...current,
			[activeLocale]: { ...current[activeLocale], ...patch },
		}));
	};
	const addTag = (name: string) => {
		const value = name.trim();
		if (value.length < 2 || value.length > 50 || value.includes(',') || selectedTags.length >= 8 || selectedTags.some((tag) => tagKey(tag) === tagKey(value))) return;
		updateActive({ tags: [...selectedTags, value].join(', ') });
		setTagSearches((current) => ({ ...current, [activeLocale]: '' }));
	};

	const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		try {
			return await fetch(input, init);
		} catch {
			return Response.json({ error: copy.networkError }, { status: 503 });
		}
	};

	const readError = async (response: Response): Promise<Notice> => {
		try {
			const result = (await response.json()) as { error?: string; detail?: string };
			return {
				tone: 'error',
				title: result.error ?? copy.actionFailed,
				detail: result.detail ?? null,
			};
		} catch {
			return { tone: 'error', title: copy.actionFailed };
		}
	};

	const save = async (event?: { preventDefault: () => void }) => {
		event?.preventDefault();
		let keywords: string[];
		try { keywords = keywordsForSave(selectedTags, tagSearch, tagOptions, activeLocale); }
		catch { showNotice({ tone: 'error', title: copy.keywordInvalid }); return; }
		setBusy(true);
		setNotice(null);
		const payload = {
			title: draft.title,
			slug: effectiveSlug,
			excerpt: draft.excerpt,
			markdown: draft.markdown,
			status: draft.status,
			locale: activeLocale,
			seoTitle: draft.seoTitle || draft.title,
			seoDescription: draft.seoDescription || draft.excerpt,
			coverUrl: draft.coverUrl,
			coverAlt: draft.coverAlt,
			categoryId: categoryId || null,
			...(translationGroupId ? { translationGroupId } : {}),
			tags: keywords,
		};
		const response = await safeFetch(draft.id ? `/api/admin/posts/${draft.id}` : '/api/admin/posts', {
			method: draft.id ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = (await response.json()) as {
			id: string;
			updatedAt?: string;
			translationGroupId?: string;
			slug?: string;
		};
		setBusy(false);
		setTagSearches((current) => ({ ...current, [activeLocale]: '' }));
		setDirtyLocales((current) => ({ ...current, [activeLocale]: false }));
		setCategoryDirty(false);
		setTranslationGroupId((current) => current ?? result.translationGroupId);
		setVersions((current) => ({
			...current,
			[activeLocale]: {
				...current[activeLocale],
				tags: keywords.join(', '),
				slug: result.slug ?? effectiveSlug,
				id: result.id,
				updatedAt: result.updatedAt,
			},
		}));
		showNotice({ tone: 'success', title: copy.saved });
		if (mode === 'create' && result.id) {
			history.replaceState(null, '', `/admin/posts/${result.id}`);
		}
	};

	const translate = async () => {
		const source = versions[otherLocale];
		if (source.title.trim().length < 3 || source.excerpt.trim().length < 20 || source.markdown.trim().length < 20) {
			showNotice({ tone: 'info', title: copy.sourceEmpty });
			return;
		}
		const activeHasContent = Boolean(draft.title || draft.excerpt || draft.markdown);
		if (activeHasContent && !confirm(copy.confirmTranslate)) return;

		setBusy(true);
		showNotice({ tone: 'info', title: copy.translating });
		const response = await safeFetch('/api/admin/posts/translate-fields', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sourceLocale: otherLocale,
				targetLocale: activeLocale,
				title: source.title,
				excerpt: source.excerpt,
				markdown: source.markdown,
				seoTitle: source.seoTitle || source.title,
				seoDescription: source.seoDescription || source.excerpt,
				coverAlt: source.coverAlt || null,
				tags: source.tags
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
		const result = (await response.json()) as {
			translated: {
				title: string;
				excerpt: string;
				markdown: string;
				seoTitle: string;
				seoDescription: string;
				coverAlt?: string | null;
				tags: string[];
			};
		};
		setBusy(false);
		setDirtyLocales((current) => ({ ...current, [activeLocale]: true }));
		setVersions((current) => ({
			...current,
			[activeLocale]: {
				...current[activeLocale],
				title: result.translated.title,
				excerpt: result.translated.excerpt,
				markdown: result.translated.markdown,
				seoTitle: result.translated.seoTitle,
				seoDescription: result.translated.seoDescription,
				coverAlt: result.translated.coverAlt ?? current[activeLocale].coverAlt,
				tags: result.translated.tags.join(', '),
				status: current[activeLocale].status || 'draft',
			},
		}));
		showNotice({ tone: 'success', title: copy.translateDone });
	};

	const classify = async () => {
		if (!draft.id || dirty) {
			showNotice({ tone: 'info', title: copy.saveBeforeClassify });
			return;
		}
		if (!confirm(copy.confirmClassify)) return;
		setBusy(true);
		showNotice({ tone: 'info', title: copy.classifying });
		const response = await safeFetch(`/api/admin/posts/${draft.id}/classify`, { method: 'POST' });
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		location.reload();
	};
	const generateFromIdea = async () => {
		if (idea.trim().length < 10 || busy) return;
		setBusy(true); setNotice(null); setGeneratedDraft('');
		const response = await safeFetch('/api/admin/posts/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: idea, locale: activeLocale }) });
		if (!response.ok) { setBusy(false); showNotice(await readError(response)); return; }
		const result = await response.json();
		setBusy(false);
		if (typeof result.id !== 'string' || !result.id) { showNotice({ tone: 'error', title: copy.actionFailed }); return; }
		setGeneratedDraft(result.id); showNotice({ tone: 'success', title: copy.ideaReady });
	};

	const remove = async () => {
		if (!draft.id || !confirm(copy.confirmDelete)) return;
		setBusy(true);
		const response = await safeFetch(`/api/admin/posts/${draft.id}`, { method: 'DELETE' });
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
	useEffect(() => {
		const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	const md = (before: string, after = '', fallback = '') =>
		insertMarkdown(markdownRef, before, after, fallback, (value) => updateActive({ markdown: value }));

	const toolbar = [
		{ label: copy.toolbarHeading, icon: Heading, run: () => md('## ', '', 'Heading') },
		{ label: copy.toolbarBold, icon: Bold, run: () => md('**', '**', 'bold') },
		{ label: copy.toolbarItalic, icon: Italic, run: () => md('_', '_', 'italic') },
		{ label: copy.toolbarStrike, icon: Strikethrough, run: () => md('~~', '~~', 'strike') },
		{ label: copy.toolbarCode, icon: Code, run: () => md('`', '`', 'code') },
		{ label: copy.toolbarLink, icon: Link2, run: () => md('[', '](https://)', 'link') },
		{ label: copy.toolbarList, icon: List, run: () => md('- ', '', 'item') },
		{ label: copy.toolbarOrdered, icon: ListOrdered, run: () => md('1. ', '', 'item') },
		{ label: copy.toolbarQuote, icon: Quote, run: () => md('> ', '', 'quote') },
		{ label: copy.toolbarImage, icon: ImageIcon, run: () => md('![', '](https://)', 'alt') },
	] as const;

	return (
		<div className="space-y-6 pb-28">
			<section className="rounded-2xl border border-white bg-white p-5 sm:p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
					<div className="min-w-0">
						<h2 className="font-headline text-xl font-bold tracking-tight text-black">{copy.aiImportTitle}</h2>
						<p className="mt-1 max-w-2xl font-body text-sm font-normal text-black">{copy.aiImportDesc}</p>
					</div>
					<a
						href="/admin/importar"
						className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-5 font-body font-medium text-white hover:bg-primary-700"
					>
						{copy.reviewWord}
					</a>
				</div>
			</section>
			{mode === 'create' && <details className="rounded-2xl border border-white bg-white p-5 sm:p-6"><summary className="cursor-pointer font-headline text-xl font-bold text-black">{copy.ideaTitle}</summary><p className="mt-2 text-sm text-black/70">{copy.ideaHint}</p><label className="mt-3 block font-bold">{copy.ideaLabel}<textarea className={`${fieldClass} mt-1 min-h-24`} maxLength={4000} value={idea} onChange={(event) => setIdea(event.target.value)} /></label><button type="button" disabled={busy || idea.trim().length < 10} onClick={generateFromIdea} className="mt-3 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50">{busy ? copy.ideaWorking : copy.ideaGenerate}</button>{generatedDraft && <a href={`/admin/posts/${generatedDraft}`} className="ml-3 inline-flex min-h-11 items-center font-bold text-primary underline">{copy.ideaOpen}</a>}</details>}

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div
					role="tablist"
					aria-label={copy.localeTabsAria}
					className="inline-grid h-11 grid-cols-2 gap-1 rounded-xl border-2 border-white bg-white p-1"
				>
					{(
						[
							['es', copy.localeEs],
							['en', copy.localeEn],
						] as const
					).map(([code, label]) => (
						<button
							key={code}
							type="button"
							role="tab"
							aria-selected={activeLocale === code}
							onClick={() => setActiveLocale(code)}
							className="min-w-28 rounded-lg px-4 font-body text-sm font-medium text-black aria-selected:bg-primary aria-selected:text-white"
						>
							{label}{(dirtyLocales[code] || tagSearches[code].trim() || (categoryDirty && activeLocale === code)) ? ` · ${copy.unsaved}` : ''}
						</button>
					))}
				</div>
				{!draft.id && !draft.title.trim() && !draft.markdown.trim() && Boolean(other.title.trim() && other.markdown.trim()) && <button
					type="button"
					onClick={translate}
					disabled={busy}
					title={copy.translateHint}
					className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary-700 bg-white px-4 font-body font-medium text-primary-800 hover:bg-primary-100 disabled:opacity-50"
				>
					<Languages size={18} aria-hidden /> {busy ? copy.translating : copy.translate}
				</button>}
			</div>

			<form onSubmit={save} className="space-y-5">
				<SectionCard number={1} title={copy.sectionInfo}>
					<div className="space-y-4">
						<label className="block">
							<span className={labelClass}>{copy.title}</span>
							<input
								className={fieldClass}
								required
								minLength={3}
								value={draft.title}
								onChange={(e) => updateActive({ title: e.target.value })}
							/>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.slug}</span>
							<input
								className={fieldClass}
								required
								minLength={3}
								value={effectiveSlug}
								onChange={(e) => updateActive({ slug: e.target.value })}
							/>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.excerpt}</span>
							<textarea
								className={`${fieldClass} min-h-24`}
								required
								minLength={20}
								value={draft.excerpt}
								onChange={(e) => updateActive({ excerpt: e.target.value })}
							/>
							<span className={hintClass}>{copy.excerptHint}</span>
						</label>
					</div>
				</SectionCard>

				<SectionCard number={2} title={copy.sectionContent}>
					<label className="block">
						<span className={labelClass}>{copy.markdown}</span>
						<div className="overflow-hidden rounded-xl border border-black-stroke/30">
							<div
								role="toolbar"
								aria-label={copy.toolbarAria}
								className="flex flex-wrap gap-1 border-b border-black/10 bg-primary-100/50 p-2"
							>
								{toolbar.map(({ label, icon: Icon, run }) => (
									<button
										key={label}
										type="button"
										aria-label={label}
										title={label}
										onClick={run}
										className="inline-flex size-9 items-center justify-center rounded-md text-black/60 hover:bg-white hover:text-primary"
									>
										<Icon aria-hidden size={16} />
									</button>
								))}
							</div>
							<textarea
								ref={markdownRef}
								className="min-h-[22rem] w-full resize-y border-0 bg-white px-3 py-3 font-mono text-sm font-normal text-black outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
								required
								minLength={20}
								value={draft.markdown}
								onChange={(e) => updateActive({ markdown: e.target.value })}
							/>
						</div>
					</label>
				</SectionCard>

				<SectionCard number={3} title={copy.sectionSettings}>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="block">
							<span className={labelClass}>{copy.status}</span>
							<span className="relative block">
								<select
									className={selectClass}
									value={draft.status}
									onChange={(e) => updateActive({ status: e.target.value as LocaleDraft['status'] })}
								>
									<option value="draft">{copy.statusDraft}</option>
									<option value="published">{copy.statusPublished}</option>
								</select>
								<ChevronDown
									aria-hidden="true"
									size={16}
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/55"
								/>
							</span>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.category}</span>
							<span className="relative block">
								<select
									className={selectClass}
									value={categoryId}
									onChange={(e) => {
										setCategoryDirty(true);
										setCategoryId(e.target.value);
									}}
								>
									<option value="">{copy.noCategory}</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
								<ChevronDown
									aria-hidden="true"
									size={16}
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/55"
								/>
							</span>
							<span className={hintClass}>{copy.categoryHint}</span>
						</label>
						<fieldset className="min-w-0 sm:col-span-2">
							<legend className={labelClass}>{copy.tags}</legend>
							{selectedTags.length > 0 && (
								<div className="mt-3 flex flex-wrap gap-2" aria-label={copy.keywordsSelected}>
									{selectedTags.map((tag, index) => (
										<span
											key={`${tag}-${index}`}
											className="inline-flex items-center gap-2 rounded-lg bg-primary-100 px-3 py-1 text-sm font-semibold"
										>
											{tag}
											<button
												type="button"
												aria-label={copy.keywordRemove.replace('{name}', tag)}
												onClick={() =>
													updateActive({
														tags: selectedTags.filter((_, i) => i !== index).join(', '),
													})
												}
												className="rounded px-1 text-primary-800 hover:bg-primary-200"
											>
												×
											</button>
										</span>
									))}
								</div>
							)}
							<label htmlFor="tag-search" className="mt-3 block text-sm font-bold">
								{copy.keywordSearch}
							</label>
							<input
								id="tag-search"
								className={`${fieldClass} mt-1`}
								placeholder={copy.tagsPlaceholder}
								value={tagSearch}
								onChange={(e) =>
									setTagSearches((current) => ({ ...current, [activeLocale]: e.target.value }))
								}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										const exact = availableTags.find((tag) =>
											[tag.name, tag.nameEn].some((name) => name && tagKey(name) === tagKey(search)),
										);
										if (exact) addTag(exact.label);
										else if (!matchesExistingTag) addTag(search);
									}
								}}
								maxLength={50}
							/>
							{selectedTags.length >= 8 && <p className={`mt-2 ${helpClass}`}>{copy.keywordsLimit}</p>}
							{availableTags.length > 0 && <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-black/10 bg-white" aria-label={copy.keywordsAvailable}>{availableTags.map((tag) => <li key={tag.id}><button type="button" disabled={selectedTags.length >= 8} onClick={() => addTag(tag.label)} className="min-h-11 w-full px-3 text-left text-sm hover:bg-primary-100 disabled:opacity-50">+ {tag.label}</button></li>)}</ul>}
							{search.length >= 2 && !search.includes(',') && !matchesExistingTag && <button type="button" disabled={selectedTags.length >= 8} onClick={() => addTag(search)} className="mt-2 min-h-11 rounded-lg border border-primary-700 px-3 text-sm font-bold text-primary-800 disabled:opacity-50">{copy.keywordCreate.replace('{name}', search)}</button>}
							{search.includes(',') && <p className="mt-2 text-sm text-error-700">{copy.keywordComma}</p>}
						</fieldset>
						{draft.id && (
							<button
								type="button"
								onClick={classify}
								disabled={busy || dirty}
								className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary-700 bg-white px-4 font-body font-medium text-primary-800 hover:bg-primary-100 disabled:opacity-50 sm:col-span-2"
							>
								<Sparkles size={18} aria-hidden /> {copy.suggestTaxonomy}
							</button>
						)}
					</div>
				</SectionCard>

				<SectionCard number={4} title={copy.sectionSeo}>
					<div className="space-y-4">
						<label className="block">
							<span className={labelClass}>{copy.seoTitle}</span>
							<input
								className={fieldClass}
								value={draft.seoTitle}
								onChange={(e) => updateActive({ seoTitle: e.target.value })}
							/>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.seoDescription}</span>
							<textarea
								className={`${fieldClass} min-h-24`}
								value={draft.seoDescription}
								onChange={(e) => updateActive({ seoDescription: e.target.value })}
							/>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.coverUrl}</span>
							<input
								className={fieldClass}
								value={draft.coverUrl}
								onChange={(e) => updateActive({ coverUrl: e.target.value })}
							/>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.coverAlt}</span>
							<input
								className={fieldClass}
								value={draft.coverAlt}
								onChange={(e) => updateActive({ coverAlt: e.target.value })}
							/>
						</label>
					</div>
				</SectionCard>

				<div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 px-5 py-4 backdrop-blur lg:left-[15.5rem]">
					<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
						<div className="flex flex-wrap items-center gap-3">
							{draft.id && (
								<>
									<a
										href={`/admin/posts/${draft.id}/preview`}
										target="_blank"
										rel="noopener"
										aria-label={copy.preview}
										title={copy.preview}
										className="inline-flex size-11 items-center justify-center rounded-lg border border-primary-700 bg-white text-primary-800 hover:bg-primary-100"
									>
										<Eye size={18} aria-hidden />
									</a>
									<button
										type="button"
										onClick={remove}
										disabled={busy}
										aria-label={copy.deleteArticle}
										title={copy.deleteArticle}
										className="inline-flex size-11 items-center justify-center rounded-lg border border-error-700 text-error-700 hover:bg-error-100 disabled:opacity-50"
									>
										<Trash2 size={18} aria-hidden />
									</button>
								</>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<a
								href="/admin/posts"
								className="inline-flex min-h-11 items-center rounded-lg border border-black/15 bg-white px-5 font-body font-medium text-black/70 hover:bg-black/5"
							>
								{copy.cancel}
							</a>
							<button
								type="submit"
								disabled={busy}
								className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-body font-medium text-white hover:bg-primary-700 disabled:opacity-50"
							>
								<Save size={18} aria-hidden /> {busy ? copy.saving : copy.saveArticle}
							</button>
						</div>
					</div>
				</div>
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
