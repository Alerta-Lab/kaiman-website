import { useId } from 'react';

type SwitchProps = {
	checked: boolean;
	onChange: (value: boolean) => void;
	label: string;
	offLabel: string;
	onLabel: string;
};

export function Switch({ checked, onChange, label, offLabel, onLabel }: SwitchProps) {
	const labelId = useId();

	return (
		<div className="flex flex-wrap items-center gap-3">
			<span id={labelId} className="text-sm text-neutral-300">
				{label}
			</span>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-labelledby={labelId}
				onClick={() => onChange(!checked)}
				className={`relative h-8 w-12 shrink-0 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${checked ? 'bg-primary' : 'bg-ink-400'}`}
			>
				<span
					className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${checked ? 'translate-x-4' : 'translate-x-0'}`}
				/>
			</button>
			<span className="text-sm font-semibold text-white">{checked ? onLabel : offLabel}</span>
		</div>
	);
}
