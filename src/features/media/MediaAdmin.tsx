import {
	Check,
	ChevronLeft,
	ChevronRight,
	Copy,
	ImagePlus,
	LayoutGrid,
	List,
	Search,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react';
import { Toast } from '../../components/blog/molecules/Toast';
import type { AdminCopy } from '../../i18n/locales/es/admin';
import type { ContentLocale } from '../../server/db/schema';

export type MediaRecord = {
	id: string;
	url: string;
	pathname: string;
	filename: string;
	mimeType: string;
	alt: string | null;
	createdAt: string;
};

export type MediaListPayload = {
	items: MediaRecord[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

type ViewMode = 'grid' | 'list';

type Props = {
	initial: MediaListPayload;
	locale: ContentLocale;
	copy: AdminCopy['media'];
};

const SEARCH_DEBOUNCE_MS = 350;

const fill = (template: string, values: Record<string, string | number>) =>
	Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);

export function MediaAdmin({ initial, copy, locale: _locale }: Props) {
	const fileInputId = useId();
	const altInputId = useId();
	const searchId = useId();
	const fileRef = useRef<HTMLInputElement>(null);
	const previewUrlRef = useRef<string | null>(null);
	const skipNextFetch = useRef(true);

	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [alt, setAlt] = useState('');
	const [status, setStatus] = useState('');
	const [uploading, setUploading] = useState(false);

	const [view, setView] = useState<ViewMode>('grid');
	const [searchInput, setSearchInput] = useState('');
	const [query, setQuery] = useState('');
	const [page, setPage] = useState(initial.page);
	const [data, setData] = useState(initial);
	const [loadingList, setLoadingList] = useState(false);
	const [listError, setListError] = useState('');
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [copyToastOpen, setCopyToastOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<MediaRecord | null>(null);
	const [deleting, setDeleting] = useState(false);
	const cancelDeleteRef = useRef<HTMLButtonElement>(null);
	const [, startTransition] = useTransition();
	const closeCopyToast = useCallback(() => setCopyToastOpen(false), []);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			const next = searchInput.trim();
			setQuery((current) => {
				if (current === next) return current;
				setPage(1);
				return next;
			});
		}, SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(timer);
	}, [searchInput]);

	useEffect(() => {
		if (skipNextFetch.current) {
			skipNextFetch.current = false;
			return;
		}

		const controller = new AbortController();
		const load = async () => {
			setLoadingList(true);
			setListError('');
			try {
				const params = new URLSearchParams({
					page: String(page),
					pageSize: String(initial.pageSize),
				});
				if (query) params.set('q', query);
				const response = await fetch(`/api/admin/media?${params}`, { signal: controller.signal });
				const result = (await response.json()) as MediaListPayload & { error?: string };
				if (!response.ok) throw new Error(result.error ?? copy.loadError);
				startTransition(() => setData(result));
			} catch (error) {
				if ((error as Error).name === 'AbortError') return;
				setListError(error instanceof Error ? error.message : copy.loadError);
			} finally {
				setLoadingList(false);
			}
		};

		void load();
		return () => controller.abort();
	}, [page, query, initial.pageSize, copy.loadError]);

	useEffect(() => {
		return () => {
			if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		};
	}, []);

	const setSelectedFile = (next: File | null) => {
		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = null;
		}
		setFile(next);
		if (next) {
			const url = URL.createObjectURL(next);
			previewUrlRef.current = url;
			setPreviewUrl(url);
		} else {
			setPreviewUrl(null);
			if (fileRef.current) fileRef.current.value = '';
		}
	};

	const onFileChange = (files: FileList | null) => {
		const next = files?.[0] ?? null;
		if (!next) return;
		if (!next.type.startsWith('image/')) {
			setStatus(copy.invalidType);
			return;
		}
		if (next.size > 8 * 1024 * 1024) {
			setStatus(copy.tooLarge);
			return;
		}
		setStatus('');
		setSelectedFile(next);
	};

	const refreshList = async (nextPage = page, nextQuery = query) => {
		const params = new URLSearchParams({
			page: String(nextPage),
			pageSize: String(initial.pageSize),
		});
		if (nextQuery) params.set('q', nextQuery);
		const response = await fetch(`/api/admin/media?${params}`);
		const payload = (await response.json()) as MediaListPayload & { error?: string };
		if (!response.ok) throw new Error(payload.error ?? copy.loadError);
		setData(payload);
		return payload;
	};

	const onUpload = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!file) {
			setStatus(copy.selectImage);
			return;
		}
		if (!alt.trim()) {
			setStatus(copy.needAlt);
			return;
		}
		setUploading(true);
		setStatus(copy.uploading);
		const body = new FormData();
		body.set('image', file);
		body.set('alt', alt.trim());
		try {
			const response = await fetch('/api/admin/media', { method: 'POST', body });
			const result = (await response.json()) as { error?: string };
			if (!response.ok) {
				setStatus(result.error ?? copy.uploadError);
				return;
			}
			setSelectedFile(null);
			setAlt('');
			setStatus(copy.uploaded);
			skipNextFetch.current = true;
			setSearchInput('');
			setQuery('');
			setPage(1);
			await refreshList(1, '');
		} catch {
			setStatus(copy.networkError);
		} finally {
			setUploading(false);
		}
	};

	const copyUrl = async (item: MediaRecord) => {
		await navigator.clipboard.writeText(item.url);
		setCopiedId(item.id);
		setCopyToastOpen(true);
		window.setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1600);
	};

	useEffect(() => {
		if (!pendingDelete) return;
		cancelDeleteRef.current?.focus();
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !deleting) setPendingDelete(null);
		};
		document.addEventListener('keydown', onKeyDown);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [pendingDelete, deleting]);

	const confirmDelete = async () => {
		if (!pendingDelete) return;
		setDeleting(true);
		setListError('');
		try {
			const response = await fetch('/api/admin/media', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: pendingDelete.id }),
			});
			if (!response.ok) {
				const result = (await response.json()) as { error?: string };
				setListError(result.error ?? copy.deleteError);
				return;
			}
			setPendingDelete(null);
			const payload = await refreshList(page, query);
			if (payload.items.length === 0 && payload.page > 1) {
				skipNextFetch.current = true;
				setPage(payload.page - 1);
				await refreshList(payload.page - 1, query);
			}
		} catch (error) {
			setListError(error instanceof Error ? error.message : copy.updateError);
		} finally {
			setDeleting(false);
		}
	};

	const countLabel =
		data.total === 1
			? copy.countOne
			: `${fill(copy.countMany, { count: data.total })}${query ? copy.countFound : ''}`;

	return (
		<div className="space-y-8">
			<form
				onSubmit={onUpload}
				className="rounded-2xl border border-black/10 bg-white p-5"
				aria-busy={uploading}
			>
				<div className="grid gap-5 sm:grid-cols-[12rem_1fr] sm:items-start">
					<div className="space-y-3">
						<input
							ref={fileRef}
							id={fileInputId}
							name="image"
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={(event) => onFileChange(event.target.files)}
						/>
						{previewUrl ? (
							<div className="relative aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-primary-100">
								<img src={previewUrl} alt="" className="size-full object-cover" />
								<div className="absolute inset-x-0 bottom-0 flex gap-2 bg-black/55 p-2">
									<button
										type="button"
										className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-2 text-sm font-bold text-black hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										onClick={() => fileRef.current?.click()}
									>
										<Upload aria-hidden="true" size={16} /> {copy.replace}
									</button>
									<button
										type="button"
										className="inline-flex size-11 items-center justify-center rounded-lg bg-white text-error-700 hover:bg-error-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										aria-label={copy.removeSelected}
										onClick={() => setSelectedFile(null)}
									>
										<Trash2 aria-hidden="true" size={16} />
									</button>
								</div>
							</div>
						) : (
							<label
								htmlFor={fileInputId}
								className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/25 bg-primary-100 px-3 text-center text-sm font-bold text-black/70 transition hover:border-primary hover:bg-primary-200 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
							>
								<ImagePlus aria-hidden="true" size={28} className="text-primary" />
								<span>{copy.uploadFile}</span>
								<span className="font-medium text-black/50">{copy.maxSize}</span>
							</label>
						)}
					</div>

					<div className="flex min-w-0 flex-col gap-4">
						<div>
							<label htmlFor={altInputId} className="mb-1.5 block text-sm font-bold text-black/70">
								{copy.altLabel}
							</label>
							<input
								id={altInputId}
								name="alt"
								value={alt}
								onChange={(event) => setAlt(event.target.value)}
								required
								minLength={2}
								placeholder={copy.altPlaceholder}
								className="min-h-11 w-full rounded-lg border border-black-stroke px-3 font-medium"
							/>
						</div>
						<button
							type="submit"
							disabled={uploading || !file}
							className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						>
							<ImagePlus aria-hidden="true" size={18} />
							{uploading ? copy.uploading : copy.upload}
						</button>
						<p aria-live="polite" className="min-h-5 text-sm font-bold text-black/70">
							{status}
						</p>
					</div>
				</div>
			</form>

			<section aria-labelledby="media-library-heading" className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p id="media-library-heading" className="shrink-0 font-bold text-black">
						{countLabel}
					</p>
					<div
						className="flex items-center gap-0.5 rounded-lg border border-black/10 bg-white p-0.5"
						role="group"
						aria-label={copy.viewMode}
					>
						<button
							type="button"
							aria-pressed={view === 'grid'}
							aria-label={copy.grid}
							onClick={() => setView('grid')}
							className="inline-flex size-9 items-center justify-center rounded-md text-black/70 hover:bg-primary-100 aria-[pressed=true]:bg-primary aria-[pressed=true]:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						>
							<LayoutGrid aria-hidden="true" size={16} />
						</button>
						<button
							type="button"
							aria-pressed={view === 'list'}
							aria-label={copy.list}
							onClick={() => setView('list')}
							className="inline-flex size-9 items-center justify-center rounded-md text-black/70 hover:bg-primary-100 aria-[pressed=true]:bg-primary aria-[pressed=true]:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						>
							<List aria-hidden="true" size={16} />
						</button>
					</div>
					<label className="relative w-full min-w-0 basis-full">
						<span className="sr-only">{copy.searchAria}</span>
						<Search
							aria-hidden="true"
							size={16}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/45"
						/>
						<input
							id={searchId}
							type="search"
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							placeholder={copy.searchPlaceholder}
							className="min-h-11 w-full rounded-lg border border-black-stroke bg-white py-2 pl-9 pr-3 font-medium"
						/>
					</label>
				</div>

				{listError ? (
					<p role="alert" className="rounded-lg bg-error-100 p-3 text-sm font-bold text-error-700">
						{listError}
					</p>
				) : null}

				{data.items.length === 0 ? (
					<p className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-center font-medium text-black/60">
						{query ? copy.emptySearch : copy.empty}
					</p>
				) : (
					<ul
						className={
							view === 'grid'
								? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
								: 'flex flex-col gap-3'
						}
						aria-busy={loadingList}
					>
						{data.items.map((item) => (
							<li
								key={item.id}
								className={
									view === 'grid'
										? 'overflow-hidden rounded-xl border border-black/10 bg-white'
										: 'flex items-center gap-4 rounded-xl border border-black/10 bg-white p-3'
								}
							>
								<img
									src={item.url}
									alt={item.alt ?? ''}
									className={
										view === 'grid'
											? 'aspect-square w-full object-cover'
											: 'size-16 shrink-0 rounded-lg object-cover'
									}
								/>
								<div
									className={
										view === 'grid'
											? 'flex items-start justify-between gap-2 p-3'
											: 'flex min-w-0 flex-1 items-center justify-between gap-3'
									}
								>
									<div className="min-w-0">
										<p className="truncate font-bold text-black">{item.filename}</p>
										{item.alt ? (
											<p className="mt-0.5 truncate text-sm font-medium text-black/55">{item.alt}</p>
										) : null}
									</div>
									<div className="flex shrink-0 gap-1">
										<button
											type="button"
											aria-label={
												copiedId === item.id
													? fill(copy.copiedUrl, { name: item.filename })
													: fill(copy.copyUrl, { name: item.filename })
											}
											onClick={() => void copyUrl(item)}
											className="inline-flex size-11 items-center justify-center rounded-lg text-primary hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										>
											{copiedId === item.id ? (
												<Check aria-hidden="true" size={18} className="text-success-700" />
											) : (
												<Copy aria-hidden="true" size={18} />
											)}
										</button>
										<button
											type="button"
											aria-label={fill(copy.delete, { name: item.filename })}
											onClick={() => setPendingDelete(item)}
											className="inline-flex size-11 items-center justify-center rounded-lg text-error-700 hover:bg-error-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
										>
											<Trash2 aria-hidden="true" size={18} />
										</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}

				{data.totalPages > 1 ? (
					<nav
						aria-label={copy.paginationAria}
						className="flex flex-wrap items-center justify-center gap-3 pt-2"
					>
						<button
							type="button"
							disabled={page <= 1 || loadingList}
							onClick={() => setPage((current) => Math.max(1, current - 1))}
							className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 font-bold text-black hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-45"
						>
							<ChevronLeft aria-hidden="true" size={18} /> {copy.previous}
						</button>
						<p className="font-bold text-black/70">
							{fill(copy.pageOf, { page: data.page, totalPages: data.totalPages })}
						</p>
						<button
							type="button"
							disabled={page >= data.totalPages || loadingList}
							onClick={() => setPage((current) => current + 1)}
							className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 font-bold text-black hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-45"
						>
							{copy.next} <ChevronRight aria-hidden="true" size={18} />
						</button>
					</nav>
				) : null}
			</section>

			<Toast
				open={copyToastOpen}
				tone="success"
				title={copy.linkCopied}
				onClose={closeCopyToast}
				autoHideMs={2500}
			/>

			{pendingDelete ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
					<button
						type="button"
						className="absolute inset-0 bg-black/50"
						aria-label={copy.closeDialog}
						disabled={deleting}
						onClick={() => setPendingDelete(null)}
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-media-title"
						aria-describedby="delete-media-desc"
						className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-lg"
					>
						<div className="flex items-start justify-between gap-3">
							<h2 id="delete-media-title" className="font-headline text-xl font-bold text-black">
								{copy.deleteTitle}
							</h2>
							<button
								type="button"
								className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-black/60 hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
								aria-label={copy.close}
								disabled={deleting}
								onClick={() => setPendingDelete(null)}
							>
								<X aria-hidden="true" size={18} />
							</button>
						</div>
						<div className="mt-4 flex gap-3">
							<img
								src={pendingDelete.url}
								alt=""
								className="size-16 shrink-0 rounded-lg object-cover"
							/>
							<p id="delete-media-desc" className="min-w-0 font-medium text-black/75">
								{fill(copy.deleteDesc, { name: pendingDelete.filename })}
							</p>
						</div>
						<div className="mt-6 flex flex-wrap justify-end gap-3">
							<button
								ref={cancelDeleteRef}
								type="button"
								disabled={deleting}
								onClick={() => setPendingDelete(null)}
								className="inline-flex min-h-11 items-center justify-center rounded-lg border border-black/15 px-4 font-bold text-black hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
							>
								{copy.cancel}
							</button>
							<button
								type="button"
								disabled={deleting}
								onClick={() => void confirmDelete()}
								className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-error-700 px-4 font-bold text-white hover:bg-error-700/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
							>
								<Trash2 aria-hidden="true" size={16} />
								{deleting ? copy.deleting : copy.deleteTitle}
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
