import { useEffect, useId, useRef } from 'react';

type Props = {
	open: boolean;
	title: string;
	description: string;
	items: string[];
	warning?: string;
	confirmLabel: string;
	cancelLabel: string;
	danger?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

/** Native modal provides focus containment, Escape handling and focus restoration. */
export function ConfirmDialog({ open, title, description, items, warning, confirmLabel, cancelLabel, danger, onCancel, onConfirm }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const descriptionId = useId();
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	}, [open]);
	return (
		<dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onCancel(); }} aria-labelledby={titleId} aria-describedby={descriptionId} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl border border-black/10 bg-white p-0 text-black shadow-xl backdrop:bg-black/50">
			<div className="flex max-h-[90dvh] flex-col p-6">
				<h2 id={titleId} className="font-headline text-xl font-bold">{title}</h2>
				<p id={descriptionId} className="mt-3 text-sm font-medium leading-relaxed text-black/80">{description}</p>
				<ul className="mt-4 max-h-64 list-disc space-y-2 overflow-y-auto rounded-lg bg-primary-100/60 py-3 pl-8 pr-4 text-sm text-black">
					{items.map((item, index) => <li key={index}>{item}</li>)}
				</ul>
				{warning && <p className="mt-4 rounded-lg bg-error-100 p-3 text-sm font-semibold text-error-700">{warning}</p>}
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" autoFocus onClick={onCancel} className="min-h-11 rounded-lg border border-black/20 px-4 font-bold text-black hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{cancelLabel}</button>
					<button type="button" onClick={onConfirm} className={`min-h-11 rounded-lg px-4 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${danger ? 'bg-error-700 hover:bg-error-800 focus-visible:outline-error-700' : 'bg-primary hover:bg-primary-700 focus-visible:outline-primary'}`}>{confirmLabel}</button>
				</div>
			</div>
		</dialog>
	);
}
