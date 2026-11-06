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
	Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Toast, type ToastTone } from '../../components/blog/molecules/Toast';
import type { AdminCopy } from '../../i18n/locales/es/admin';

type ContentLocale = 'es' | 'en';
type EditorCopy = AdminCopy['editor'];

type LocaleDraft = {
	id?: string;
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

type Notice = { tone: ToastTone; title: string; detail?: string | null };

const emptyDraft = (): LocaleDraft => ({
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

const labelClass = 'mb-1.5 block font-body text-sm font-normal text-black/55';
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
	mode = 'create',
	initialVersions = [],
	translationGroupId: initialGroupId,
	initialSlug = '',
	initialCategoryId = '',
	activeLocale: initialActive = 'es',
}: {
	copy: EditorCopy;
	categories?: CategoryOption[];
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
	const [slug, setSlug] = useState(initialSlug);
	const [categoryId, setCategoryId] = useState(initialCategoryId);
	const [translationGroupId, setTranslationGroupId] = useState(initialGroupId);
	const [notice, setNotice] = useState<Notice | null>(null);
	const [busy, setBusy] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [fileName, setFileName] = useState('');
	const fileRef = useRef<HTMLInputElement>(null);
	const markdownRef = useRef<HTMLTextAreaElement>(null);

	const draft = versions[activeLocale];
	const otherLocale: ContentLocale = activeLocale === 'es' ? 'en' : 'es';
	const other = versions[otherLocale];
	const derivedSlug = useMemo(() => slugify(draft.title || other.title), [draft.title, other.title]);
	const effectiveSlug = slug || derivedSlug;

	const showNotice = (next: Notice) => setNotice(next);
	const closeNotice = useCallback(() => setNotice(null), []);

	const updateActive = (patch: Partial<LocaleDraft>) => {
		setDirty(true);
		setVersions((current) => ({
			...current,
			[activeLocale]: { ...current[activeLocale], ...patch },
		}));
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
			tags: draft.tags
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean),
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
		setDirty(false);
		setTranslationGroupId((current) => current ?? result.translationGroupId);
		if (result.slug) setSlug(result.slug);
		setVersions((current) => ({
			...current,
			[activeLocale]: {
				...current[activeLocale],
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
		setDirty(true);
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
		if (!slug) setSlug(slugify(source.title) || effectiveSlug);
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

	const importWord = async () => {
		const file = fileRef.current?.files?.[0];
		if (!file) {
			showNotice({ tone: 'info', title: copy.selectWord });
			return;
		}
		if ((draft.title || draft.markdown || draft.excerpt) && !confirm(copy.confirmImport)) return;
		setBusy(true);
		showNotice({ tone: 'info', title: copy.analyzingDoc });
		const form = new FormData();
		form.set('document', file);
		form.set('locale', activeLocale);
		const response = await safeFetch('/api/admin/import-word', { method: 'POST', body: form });
		if (!response.ok) {
			setBusy(false);
			showNotice(await readError(response));
			return;
		}
		const result = await response.json();
		setBusy(false);
		setDirty(true);
		setVersions((current) => ({
			...current,
			[activeLocale]: {
				...current[activeLocale],
				title: result.title ?? current[activeLocale].title,
				excerpt: result.excerpt ?? current[activeLocale].excerpt,
				markdown: result.markdown ?? current[activeLocale].markdown,
				seoTitle: result.seoTitle ?? current[activeLocale].seoTitle,
				seoDescription: result.seoDescription ?? current[activeLocale].seoDescription,
				tags: Array.isArray(result.tags) ? result.tags.join(', ') : current[activeLocale].tags,
			},
		}));
		if (result.slug) setSlug(result.slug);
		showNotice({ tone: 'success', title: copy.imported });
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
				<h2 className="font-headline text-xl font-bold tracking-tight text-black">{copy.aiImportTitle}</h2>
				<p className="mt-1 max-w-2xl font-body text-sm font-normal text-black">{copy.aiImportDesc}</p>
				<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
					<input
						ref={fileRef}
						id="post-word-upload"
						aria-label={copy.wordDocumentAria}
						type="file"
						accept=".doc,.docx"
						className="sr-only"
						onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
					/>
					<label
						htmlFor="post-word-upload"
						className="flex min-h-11 w-full flex-1 cursor-pointer items-center gap-3 rounded-lg border border-black-stroke/30 bg-primary-100/50 px-2 py-1.5"
					>
						<span className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-primary px-3 font-body text-sm font-medium text-white">
							{copy.chooseFile}
						</span>
						<span className="truncate font-body text-sm font-normal text-black/70">
							{fileName || copy.noFileChosen}
						</span>
					</label>
					<button
						type="button"
						onClick={importWord}
						disabled={busy}
						className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-body font-medium text-white hover:bg-primary-700 disabled:opacity-50"
					>
						<Upload size={18} aria-hidden /> {copy.import}
					</button>
				</div>
			</section>

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
							{label}
						</button>
					))}
				</div>
				<button
					type="button"
					onClick={translate}
					disabled={busy}
					title={copy.translateHint}
					className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary-700 bg-white px-4 font-body font-medium text-primary-800 hover:bg-primary-100 disabled:opacity-50"
				>
					<Languages size={18} aria-hidden /> {busy ? copy.translating : copy.translate}
				</button>
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
								maxLength={120}
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
								onChange={(e) => {
									setDirty(true);
									setSlug(e.target.value);
								}}
							/>
						</label>
						<label className="block">
							<span className={labelClass}>{copy.excerpt}</span>
							<textarea
								className={`${fieldClass} min-h-24`}
								required
								minLength={20}
								maxLength={320}
								value={draft.excerpt}
								onChange={(e) => updateActive({ excerpt: e.target.value })}
							/>
							<span className="mt-1 block font-body text-xs font-normal text-black/45">{copy.excerptHint}</span>
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
										setDirty(true);
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
							<span className="mt-1 block font-body text-xs font-normal text-black/45">{copy.categoryHint}</span>
						</label>
						<label className="block sm:col-span-2">
							<span className={labelClass}>{copy.tags}</span>
							<input
								className={fieldClass}
								placeholder={copy.tagsPlaceholder}
								value={draft.tags}
								onChange={(e) => updateActive({ tags: e.target.value })}
							/>
							<span className="mt-1 block font-body text-xs font-normal text-black/45">{copy.tagsHint}</span>
						</label>
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
