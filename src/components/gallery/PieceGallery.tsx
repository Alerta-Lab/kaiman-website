import { Expand, X } from 'lucide-react';
import {
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from 'react';
import { galleryItems, type GalleryOrientation } from '../../data/gallery';
import type { LandingCopy } from '../../i18n/locales/es/landing';
import { signupUrl } from '../../lib/plans';

type PieceGalleryProps = {
	copy: LandingCopy['salsana'];
};

const aspectClass: Record<GalleryOrientation, string> = {
	portrait: 'aspect-[9/16]',
	landscape: 'aspect-video',
	square: 'aspect-square',
};

function clamp(value: number, min: number, max: number) {
	if (max < min) return min;
	return Math.min(max, Math.max(min, value));
}

export function PieceGallery({ copy }: PieceGalleryProps) {
	const [openId, setOpenId] = useState<string | null>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const boardRef = useRef<HTMLDivElement>(null);
	const offsetRef = useRef({ x: 0, y: 0 });
	const suppressClickRef = useRef(false);
	const dragRef = useRef<{
		pointerId: number;
		startX: number;
		startY: number;
		originX: number;
		originY: number;
		moved: boolean;
	} | null>(null);

	const openItem = galleryItems.find((item) => item.id === openId);

	const applyTransform = (x: number, y: number) => {
		const board = boardRef.current;
		if (!board) return;
		offsetRef.current = { x, y };
		board.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	};

	const clampToBounds = (x: number, y: number) => {
		const viewport = viewportRef.current;
		const board = boardRef.current;
		if (!viewport || !board) return { x, y };
		const minX = Math.min(0, viewport.clientWidth - board.offsetWidth);
		const minY = Math.min(0, viewport.clientHeight - board.offsetHeight);
		return {
			x: clamp(x, minX, 0),
			y: clamp(y, minY, 0),
		};
	};

	/** Board overshoots the 16:9 viewport equally on X/Y for balanced drag. */
	const syncBoardSize = () => {
		const viewport = viewportRef.current;
		const board = boardRef.current;
		if (!viewport || !board) return;
		const vw = viewport.clientWidth;
		const vh = viewport.clientHeight;
		const travel = Math.round(Math.max(vw, vh) * 1.15);
		board.style.width = `${vw + travel}px`;
		board.style.height = `${vh + travel}px`;
	};

	const centerBoard = () => {
		const viewport = viewportRef.current;
		const board = boardRef.current;
		if (!viewport || !board) return;
		syncBoardSize();
		const next = clampToBounds(
			(viewport.clientWidth - board.offsetWidth) / 2,
			(viewport.clientHeight - board.offsetHeight) / 2,
		);
		applyTransform(next.x, next.y);
	};

	useEffect(() => {
		const viewport = viewportRef.current;
		const frame = requestAnimationFrame(() => centerBoard());
		if (!viewport) return () => cancelAnimationFrame(frame);

		const observer =
			typeof ResizeObserver === 'undefined'
				? null
				: new ResizeObserver(() => {
						syncBoardSize();
						const next = clampToBounds(offsetRef.current.x, offsetRef.current.y);
						applyTransform(next.x, next.y);
					});
		observer?.observe(viewport);

		return () => {
			cancelAnimationFrame(frame);
			observer?.disconnect();
		};
	}, []);

	const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('button, a')) return;

		suppressClickRef.current = false;
		dragRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: offsetRef.current.x,
			originY: offsetRef.current.y,
			moved: false,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		event.currentTarget.dataset.dragging = 'true';
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		const dx = event.clientX - drag.startX;
		const dy = event.clientY - drag.startY;
		if (!drag.moved && Math.hypot(dx, dy) > 4) {
			drag.moved = true;
			suppressClickRef.current = true;
		}
		const next = clampToBounds(drag.originX + dx, drag.originY + dy);
		applyTransform(next.x, next.y);
	};

	const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		dragRef.current = null;
		event.currentTarget.dataset.dragging = 'false';
		try {
			event.currentTarget.releasePointerCapture(event.pointerId);
		} catch {
			/* ignore */
		}
	};

	return (
		<>
			<div
				ref={viewportRef}
				data-canvas-pan
				className="relative h-full min-h-[14rem] w-full cursor-grab overflow-hidden border border-white/10 bg-ink touch-none select-none data-[dragging=true]:cursor-grabbing"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
			>
				<div
					ref={boardRef}
					className="absolute top-0 left-0 overflow-hidden columns-5 gap-2 p-2 [column-fill:_balance] sm:columns-6 sm:gap-2.5 sm:p-2.5 lg:columns-7 will-change-transform"
				>
					{galleryItems.map((item) => (
						<article
							key={item.id}
							className="group relative mb-2 break-inside-avoid overflow-hidden bg-ink-200 sm:mb-2.5"
						>
							{item.kind === 'video' ? (
								<video
									className={`${aspectClass[item.orientation]} w-full object-cover`}
									src={item.src}
									muted
									loop
									autoPlay
									playsInline
									draggable={false}
									aria-label={copy[item.altKey]}
								/>
							) : (
								<img
									src={item.src}
									alt={copy[item.altKey]}
									draggable={false}
									className={`${aspectClass[item.orientation]} w-full object-cover`}
								/>
							)}

							<div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 bg-gradient-to-b from-black/70 to-transparent p-2">
								<p className="font-display text-[0.65rem] font-semibold leading-tight text-white sm:text-xs">
									{copy.tools[item.tool]}
								</p>
								<button
									type="button"
									className="pointer-events-auto inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-black/50 text-white transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
									aria-label={copy.fullscreen}
									onClick={(event) => {
										if (suppressClickRef.current) {
											event.preventDefault();
											suppressClickRef.current = false;
											return;
										}
										setOpenId(item.id);
									}}
								>
									<Expand size={14} aria-hidden="true" />
								</button>
							</div>

							<div className="absolute inset-x-0 bottom-0 translate-y-2 p-2 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
								<a
									href={signupUrl}
									data-cursor-go
									className="flex w-full items-center justify-center rounded-md bg-primary px-2 py-1.5 font-display text-xs font-semibold text-white hover:bg-primary-700"
									onClick={(event) => {
										if (suppressClickRef.current) {
											event.preventDefault();
											suppressClickRef.current = false;
										}
									}}
								>
									{copy.generate}
								</a>
							</div>
						</article>
					))}
				</div>
			</div>

			{openItem ? (
				<dialog
					open
					className="fixed inset-0 z-[70] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/80 p-4"
					aria-label={copy[openItem.altKey]}
				>
					<button
						type="button"
						className="absolute top-4 right-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-ink-300 text-white"
						aria-label={copy.close}
						onClick={() => setOpenId(null)}
					>
						<X size={18} aria-hidden="true" />
					</button>
					{openItem.kind === 'video' ? (
						<video className="max-h-[80vh]" src={openItem.src} controls autoPlay loop playsInline />
					) : (
						<img src={openItem.src} alt={copy[openItem.altKey]} className="max-h-[80vh]" />
					)}
				</dialog>
			) : null}
		</>
	);
}
