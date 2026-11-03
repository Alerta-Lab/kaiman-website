import { AlertCircle, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

export type ToastTone = 'error' | 'success' | 'info';

export type ToastProps = {
	tone?: ToastTone;
	title: string;
	detail?: string | null;
	open: boolean;
	onClose: () => void;
	autoHideMs?: number;
};

const toneStyles: Record<ToastTone, string> = {
	error: 'border-error-700 bg-error-100 text-error-700',
	success: 'border-success-700 bg-success-100 text-success-700',
	info: 'border-primary-700 bg-primary-100 text-primary-800',
};

const icons = {
	error: AlertCircle,
	success: CheckCircle2,
	info: AlertCircle,
};

export function Toast({ tone = 'info', title, detail, open, onClose, autoHideMs }: ToastProps) {
	const [expanded, setExpanded] = useState(false);
	const titleId = useId();
	const detailId = useId();
	const Icon = icons[tone];

	useEffect(() => {
		if (!open) setExpanded(false);
	}, [open]);

	useEffect(() => {
		if (!open || !autoHideMs || tone === 'error') return;
		const timer = window.setTimeout(onClose, autoHideMs);
		return () => window.clearTimeout(timer);
	}, [open, autoHideMs, onClose, tone]);

	if (!open) return null;

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:justify-end">
			<div
				role={tone === 'error' ? 'alert' : 'status'}
				aria-labelledby={titleId}
				aria-describedby={expanded && detail ? detailId : undefined}
				className={`pointer-events-auto w-full max-w-md rounded-xl border p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] ${toneStyles[tone]}`}
			>
				<div className="flex items-start gap-3">
					<Icon aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
					<div className="min-w-0 flex-1">
						<p id={titleId} className="font-headline text-sm font-bold text-pretty">
							{title}
						</p>
						{detail ? (
							<div className="mt-2">
								<button
									type="button"
									className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
									aria-expanded={expanded}
									aria-controls={detailId}
									onClick={() => setExpanded((value) => !value)}
								>
									{expanded ? 'Ocultar detalle' : 'Mostrar más'}
									<ChevronDown
										aria-hidden="true"
										size={16}
										className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
									/>
								</button>
								{expanded ? (
									<pre
										id={detailId}
										className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/5 p-3 font-mono text-xs font-medium whitespace-pre-wrap break-words text-black"
									>
										{detail}
									</pre>
								) : null}
							</div>
						) : null}
					</div>
					<button
						type="button"
						aria-label="Cerrar aviso"
						onClick={onClose}
						className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
					>
						<X aria-hidden="true" size={18} />
					</button>
				</div>
			</div>
		</div>
	);
}
