import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Search, Send, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import type { AdminCopy } from '../../i18n/locales/es/admin';
import { blogPostPath } from '../../lib/blog-paths';
import type { ContentLocale } from '../../server/db/schema';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

export type AdminPostRow = {
	id: string;
	title: string;
	slug: string;
	locale: 'es' | 'en';
	status: 'draft' | 'published';
	updatedAt: string;
	category: { id: string; name: string; nameEn: string | null; slug: string } | null;
};

export type AdminPostsPayload = {
	items: AdminPostRow[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

type Target = { id: string; title: string; published: boolean };

type Props = {
	initial: AdminPostsPayload;
	copy: AdminCopy['posts'];
	locale: ContentLocale;
};

const SEARCH_DEBOUNCE_MS = 350;
const cellClass = 'p-3 font-body text-sm font-semibold leading-relaxed';

const fill = (template: string, values: Record<string, string | number>) =>
	Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);

export function PostsAdmin({ initial, copy, locale }: Props) {
	const searchId = useId();
	const skipNextFetch = useRef(true);
	const [searchInput, setSearchInput] = useState('');
	const [query, setQuery] = useState('');
	const [page, setPage] = useState(initial.page);
	const [data, setData] = useState(initial);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState('');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [pending, setPending] = useState<{ title: string; question: string; targets: Target[]; warning?: string; label: string; danger?: boolean; run: () => void } | null>(null);
	const [, startTransition] = useTransition();

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
			setLoading(true);
			try {
				const params = new URLSearchParams({
					page: String(page),
					pageSize: String(initial.pageSize),
				});
				if (query) params.set('q', query);
				const response = await fetch(`/api/admin/posts?${params}`, { signal: controller.signal });
				const result = (await response.json()) as AdminPostsPayload & { error?: string };
				if (!response.ok) throw new Error(result.error ?? copy.loadError);
				startTransition(() => {
					setData(result);
					setSelectedIds(new Set());
				});
			} catch (error) {
				if ((error as Error).name === 'AbortError') return;
				setStatus(error instanceof Error ? error.message : copy.loadError);
			} finally {
				setLoading(false);
			}
		};
		void load();
		return () => controller.abort();
	}, [page, query, initial.pageSize, copy.loadError]);

	useEffect(() => {
		try {
			const flash = sessionStorage.getItem('admin-posts-flash');
			if (flash) {
				setStatus(flash);
				sessionStorage.removeItem('admin-posts-flash');
			}
		} catch {
			/* ignore */
		}
	}, []);

	const refreshList = async (nextPage = page, nextQuery = query) => {
		const params = new URLSearchParams({
			page: String(nextPage),
			pageSize: String(initial.pageSize),
		});
		if (nextQuery) params.set('q', nextQuery);
		setLoading(true);
		try {
			const response = await fetch(`/api/admin/posts?${params}`);
			const payload = (await response.json()) as AdminPostsPayload & { error?: string };
			if (!response.ok) throw new Error(payload.error ?? copy.loadError);
			setData(payload);
			setSelectedIds(new Set());
			return payload;
		} finally {
			setLoading(false);
		}
	};

	const selected = (): Target[] =>
		data.items
			.filter((post) => selectedIds.has(post.id))
			.map((post) => ({
				id: post.id,
				title: post.title,
				published: post.status === 'published',
			}));

	const allChecked = data.items.length > 0 && data.items.every((post) => selectedIds.has(post.id));
	const someChecked = data.items.some((post) => selectedIds.has(post.id));
	const selectedCount = selectedIds.size;
	const actionsDisabled = selectedCount === 0 || loading;

	const toggleAll = (checked: boolean) => {
		if (!checked) {
			setSelectedIds(new Set());
			return;
		}
		setSelectedIds(new Set(data.items.map((post) => post.id)));
	};

	const toggleOne = (id: string, checked: boolean) => {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const pluralCount = (n: number) => `${n} ${n === 1 ? copy.articleOne : copy.articleMany}`;

	const changeStatus = async (targets: Target[], next: 'published' | 'draft', confirmed = false) => {
		const toChange = targets.filter((target) => target.published !== (next === 'published'));
		if (!toChange.length) {
			setStatus(next === 'published' ? copy.alreadyPublished : copy.alreadyDraft);
			return;
		}
		const question =
			next === 'published'
				? fill(copy.confirmPublish, { count: pluralCount(toChange.length) })
				: fill(copy.confirmDraft, { count: pluralCount(toChange.length) });
		if (!confirmed) {
			setPending({ title: next === 'published' ? copy.publish : copy.toDraft, question, targets: toChange, label: next === 'published' ? copy.publish : copy.toDraft, run: () => void changeStatus(toChange, next, true) });
			return;
		}
		setStatus(next === 'published' ? copy.publishing : copy.drafting);
		try {
			const response = await fetch('/api/admin/posts/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: toChange.map((target) => target.id), status: next }),
			});
			const result = (await response.json()) as {
				updated: number;
				skipped: { title: string; reason: string }[];
				error?: string;
			};
			if (!response.ok) throw new Error(result.error ?? copy.loadError);
			const done = `${result.updated} ${
				next === 'published'
					? result.updated === 1
						? copy.publishedOne
						: copy.publishedMany
					: result.updated === 1
						? copy.draftedOne
						: copy.draftedMany
			}`;
			const skipped = result.skipped.map((item) => `«${item.title}»: ${item.reason}`).join(' · ');
			setStatus(
				skipped
					? `${done}. ${fill(copy.skippedPrefix, { count: result.skipped.length })} ${skipped}.`
					: `${done}.`,
			);
			await refreshList(page, query);
		} catch (error) {
			setStatus(error instanceof Error ? error.message : copy.networkError);
		}
	};

	const remove = async (targets: Target[], confirmed = false) => {
		const published = targets.filter((target) => target.published).length;
		const warning = published
			? `${published} ${published === 1 ? copy.deletePublishedWarnOne : copy.deletePublishedWarnMany}`
			: '';
		const confirmText =
			targets.length === 1
				? copy.confirmDeleteOne
				: fill(copy.confirmDeleteMany, { count: targets.length });
		if (!confirmed) {
			setPending({ title: copy.deleteSelected, question: confirmText, targets, warning, label: copy.delete, danger: true, run: () => void remove(targets, true) });
			return;
		}
		let failed = 0;
		for (const [index, target] of targets.entries()) {
			setStatus(fill(copy.deleting, { current: index + 1, total: targets.length }));
			try {
				const response = await fetch(`/api/admin/posts/${target.id}`, { method: 'DELETE' });
				if (!response.ok) failed++;
			} catch {
				failed++;
			}
		}
		if (failed) {
			setStatus(fill(copy.deleteFailed, { failed, total: targets.length }));
			await refreshList(page, query);
			return;
		}
		setStatus(
			`${targets.length} ${targets.length === 1 ? copy.deletedOne : copy.deletedMany}.`,
		);
		const payload = await refreshList(page, query);
		if (payload.items.length === 0 && payload.page > 1) {
			skipNextFetch.current = true;
			setPage(payload.page - 1);
			await refreshList(payload.page - 1, query);
		}
	};

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));

	return (
		<div className="space-y-4">
			<ConfirmDialog open={!!pending} title={pending?.title ?? ''} description={pending?.question ?? ''} items={pending?.targets.map((target) => target.title) ?? []} warning={pending?.warning} confirmLabel={pending?.label ?? ''} cancelLabel={locale === 'en' ? 'Cancel' : 'Cancelar'} danger={pending?.danger} onCancel={() => setPending(null)} onConfirm={() => { const action = pending?.run; setPending(null); action?.(); }} />
			<div
				role="toolbar"
				aria-label={`${copy.publish} / ${copy.toDraft} / ${copy.deleteSelected}`}
				className="flex w-full flex-wrap items-center justify-between gap-3"
			>
				<p className="font-body text-sm font-semibold text-black">
					<span id="selected-count">{selectedCount}</span> {copy.selected}
				</p>
				<div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
					<button
						type="button"
						disabled={actionsDisabled}
						onClick={() => void changeStatus(selected(), 'published')}
						className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-success-700 px-2 font-body text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:gap-2 sm:px-4 sm:text-sm"
					>
						<Send aria-hidden="true" size={16} /> {copy.publish}
					</button>
					<button
						type="button"
						disabled={actionsDisabled}
						onClick={() => void changeStatus(selected(), 'draft')}
						className="inline-flex min-h-11 min-w-0 flex-[1.5] items-center justify-center gap-1 rounded-lg border border-black/40 px-2 font-body text-xs font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:gap-2 sm:px-4 sm:text-sm"
					>
						<EyeOff aria-hidden="true" size={16} /> {copy.toDraft}
					</button>
					<button
						type="button"
						disabled={actionsDisabled}
						aria-label={copy.deleteSelected}
						onClick={() => void remove(selected())}
						className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-error-700 text-error-700 hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Trash2 aria-hidden="true" size={16} />
					</button>
				</div>
			</div>

			<label className="relative block w-full">
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
					className="min-h-11 w-full rounded-lg border border-black-stroke bg-white py-2 pl-9 pr-3 font-body text-sm font-semibold"
				/>
			</label>

			{status ? (
				<p role="status" aria-live="polite" className="rounded-lg bg-primary-100 p-3 font-body text-sm font-semibold">
					{status}
				</p>
			) : null}

			<div className="overflow-x-auto rounded-2xl border-2 border-white bg-white shadow-sm ring-1 ring-black/5">
				<table className="w-full min-w-[68rem] border-collapse text-left font-body text-sm font-semibold leading-relaxed">
					<thead className="border-b border-black/10 bg-primary-100">
						<tr>
							<th className={`w-12 ${cellClass}`}>
								<input
									type="checkbox"
									checked={allChecked}
									ref={(el) => {
										if (el) el.indeterminate = someChecked && !allChecked;
									}}
									onChange={(event) => toggleAll(event.target.checked)}
									className="size-5 accent-primary"
									aria-label={copy.selectAll}
									disabled={loading || data.items.length === 0}
								/>
							</th>
							<th className={cellClass}>{copy.columns.title}</th>
							<th className={cellClass}>{copy.columns.category}</th>
							<th className={cellClass}>{copy.columns.locale}</th>
							<th className={cellClass}>{copy.columns.status}</th>
							<th className={cellClass}>{copy.columns.updated}</th>
							<th className={`relative ${cellClass}`}>
								<span className="sr-only">{copy.columns.actions}</span>
							</th>
						</tr>
					</thead>
					<tbody aria-busy={loading}>
						{loading
							? Array.from({ length: 6 }).map((_, index) => (
									<tr key={`skeleton-${index}`} className="border-t border-black/10">
										{Array.from({ length: 7 }).map((__, cell) => (
											<td key={cell} className={cellClass}>
												<span className="block h-4 w-full max-w-[9rem] animate-pulse rounded bg-primary-200/80" />
											</td>
										))}
									</tr>
								))
							: null}
						{!loading && data.items.length === 0 ? (
							<tr>
								<td colSpan={7} className={`${cellClass} text-center text-black/60`}>
									{query ? copy.emptySearch : copy.empty}
								</td>
							</tr>
						) : null}
						{!loading
							? data.items.map((post) => (
									<tr key={post.id} className="border-t border-black/10">
										<td className={cellClass}>
											<input
												type="checkbox"
												checked={selectedIds.has(post.id)}
												onChange={(event) => toggleOne(post.id, event.target.checked)}
												className="size-5 accent-primary"
												aria-label={fill(copy.selectOne, {
													title: post.title,
													locale: post.locale.toUpperCase(),
												})}
											/>
										</td>
										<td className={cellClass}>
											<a
												href={
													post.status === 'published'
														? blogPostPath(post.locale, post.slug)
														: `/admin/posts/${post.id}/preview`
												}
												target="_blank"
												rel="noopener"
												className="text-black underline-offset-4 hover:text-primary hover:underline"
												title={
													post.status === 'published' ? copy.openPublished : copy.openPreview
												}
											>
												{post.title}
											</a>
										</td>
										<td className={cellClass}>
											{post.category ? (
												locale === 'en' && post.category.nameEn
													? post.category.nameEn
													: post.category.name
											) : (
												<span className="text-black/50">{copy.noCategory}</span>
											)}
										</td>
										<td className={`${cellClass} uppercase text-primary-800`}>{post.locale}</td>
										<td className={cellClass}>
											<span
												className={
													post.status === 'published'
														? 'rounded-full bg-success-100 px-3 py-1 text-success-700'
														: 'rounded-full bg-warning/30 px-3 py-1'
												}
											>
												{post.status === 'published' ? copy.statusPublished : copy.statusDraft}
											</span>
										</td>
										<td className={cellClass}>{formatDate(post.updatedAt)}</td>
										<td className={cellClass}>
											<div className="flex justify-end gap-1">
												<a
													href={`/admin/posts/${post.id}/preview`}
													target="_blank"
													rel="noopener"
													aria-label={`${copy.preview}: ${post.title}`}
													title={copy.preview}
													className="inline-flex size-11 items-center justify-center rounded-lg text-primary hover:bg-primary-100"
												>
													<Eye aria-hidden="true" size={16} />
												</a>
												<a
													href={`/admin/posts/${post.id}`}
													aria-label={`${copy.edit}: ${post.title}`}
													title={copy.edit}
													className="inline-flex size-11 items-center justify-center rounded-lg text-primary hover:bg-primary-100"
												>
													<Pencil aria-hidden="true" size={16} />
												</a>
												<button
													type="button"
													aria-label={`${copy.delete}: ${post.title}`}
													title={copy.delete}
													onClick={() =>
														void remove([
															{
																id: post.id,
																title: post.title,
																published: post.status === 'published',
															},
														])
													}
													className="inline-flex size-11 items-center justify-center rounded-lg text-error-700 hover:bg-error-100"
												>
													<Trash2 aria-hidden="true" size={16} />
												</button>
											</div>
										</td>
									</tr>
								))
							: null}
					</tbody>
				</table>
			</div>

			{data.totalPages > 1 ? (
				<nav
					aria-label={copy.paginationAria}
					className="flex flex-wrap items-center justify-center gap-3 pt-2"
				>
					<button
						type="button"
						disabled={page <= 1 || loading}
						onClick={() => setPage((current) => Math.max(1, current - 1))}
						className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 font-body text-sm font-semibold text-black hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-45"
					>
						<ChevronLeft aria-hidden="true" size={16} /> {copy.previous}
					</button>
					<p className="font-body text-sm font-semibold text-black/70">
						{fill(copy.pageOf, { page: data.page, totalPages: data.totalPages })}
						<span className="text-black/45">
							{' '}
							· {data.total === 1 ? copy.totalOne : fill(copy.totalMany, { count: data.total })}
						</span>
					</p>
					<button
						type="button"
						disabled={page >= data.totalPages || loading}
						onClick={() => setPage((current) => current + 1)}
						className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-black/10 bg-white px-3 font-body text-sm font-semibold text-black hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-45"
					>
						{copy.next} <ChevronRight aria-hidden="true" size={16} />
					</button>
				</nav>
			) : (
				<p className="text-center font-body text-sm font-semibold text-black/55">
					{data.total === 1 ? copy.totalOne : fill(copy.totalMany, { count: data.total })}
				</p>
			)}
		</div>
	);
}
