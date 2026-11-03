import { Expand, X } from 'lucide-react';
import { useState } from 'react';
import { galleryItems } from '../../data/gallery';
import type { LandingCopy } from '../../i18n/locales/es/landing';
import { signupUrl } from '../../lib/plans';

type PieceGalleryProps = {
	copy: LandingCopy['salsana'];
};

export function PieceGallery({ copy }: PieceGalleryProps) {
	const [openId, setOpenId] = useState<string | null>(null);
	const openItem = galleryItems.find((item) => item.id === openId);

	return (
		<>
			<div className="columns-1 gap-4 sm:columns-2 lg:columns-4">
				{galleryItems.map((item) => (
					<article key={item.id} className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-ink-200">
						{item.kind === 'video' ? (
							<video
								className="aspect-[9/16] w-full object-cover"
								src={item.src}
								muted
								loop
								autoPlay
								playsInline
								aria-label={copy[item.altKey]}
							/>
						) : (
							<img src={item.src} alt={copy[item.altKey]} className="aspect-square w-full object-cover" />
						)}

						<div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
							<p className="font-display text-sm font-semibold text-white">{copy.tools[item.tool]}</p>
							<button
								type="button"
								className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
								aria-label={copy.fullscreen}
								onClick={() => setOpenId(item.id)}
							>
								<Expand size={16} aria-hidden="true" />
							</button>
						</div>

						<div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
							<a
								href={signupUrl}
								className="flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 font-display text-sm font-semibold text-white hover:bg-primary-700"
							>
								{copy.generate}
							</a>
						</div>
					</article>
				))}
			</div>

			{openItem ? (
				<dialog
					open
					className="fixed inset-0 z-[70] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/80 p-4"
					aria-label={copy[openItem.altKey]}
				>
					<button
						type="button"
						className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink-300 text-white"
						aria-label={copy.close}
						onClick={() => setOpenId(null)}
					>
						<X size={18} aria-hidden="true" />
					</button>
					{openItem.kind === 'video' ? (
						<video
							className="max-h-[80vh] rounded-2xl"
							src={openItem.src}
							controls
							autoPlay
							loop
							playsInline
						/>
					) : (
						<img src={openItem.src} alt={copy[openItem.altKey]} className="max-h-[80vh] rounded-2xl" />
					)}
				</dialog>
			) : null}
		</>
	);
}
