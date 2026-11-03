import { AudioLines, Clapperboard, Globe, Image, Presentation, ScrollText } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { LandingCopy } from '../../i18n/locales/es/landing';
import { signupUrlForPlan, writePlanCookie } from '../../lib/plan-handoff';
import { creditUnitUsd, formatUsd, pieceCredits, plans, recommendPlan } from '../../lib/plans';

type PlanFinderProps = {
	copy: LandingCopy['finder'];
	planNames: LandingCopy['plans']['names'];
};

const limits = {
	image: 80,
	videoMinutes: 60,
	script: 80,
	audioMinutes: 120,
	presentation: 40,
	website: 12,
};

function Slider({
	id,
	label,
	value,
	max,
	onChange,
	icon,
	unit,
}: {
	id: string;
	label: string;
	value: number;
	max: number;
	onChange: (value: number) => void;
	icon: ReactNode;
	unit?: string;
}) {
	const percent = (value / max) * 100;

	return (
		<label className="flex flex-col gap-3" htmlFor={id}>
			<span className="flex items-center justify-between gap-3 font-display text-sm font-semibold text-white">
				<span className="inline-flex items-center gap-2">
					{icon}
					{label}
				</span>
				<span className="inline-flex items-baseline gap-1.5 text-primary-300">
					<span>{value}</span>
					{unit ? <span className="text-xs font-semibold text-neutral-400">{unit}</span> : null}
				</span>
			</span>
			<input
				id={id}
				className="piece-slider w-full"
				type="range"
				min={0}
				max={max}
				step={1}
				value={value}
				aria-valuemin={0}
				aria-valuemax={max}
				aria-valuenow={value}
				onChange={(event) => onChange(Number(event.target.value))}
				style={{
					background: `linear-gradient(90deg, #6B48E9 ${percent}%, #313131 ${percent}%)`,
				}}
			/>
		</label>
	);
}

export function PlanFinder({ copy, planNames }: PlanFinderProps) {
	const [image, setImage] = useState(12);
	const [videoMinutes, setVideoMinutes] = useState(3);
	const [script, setScript] = useState(8);
	const [audioMinutes, setAudioMinutes] = useState(10);
	const [presentation, setPresentation] = useState(2);
	const [website, setWebsite] = useState(0);

	const credits =
		image * pieceCredits.image +
		videoMinutes * 60 * pieceCredits.creditsPerVideoSecond +
		script * pieceCredits.script +
		audioMinutes * pieceCredits.creditsPerAudioMinute +
		presentation * pieceCredits.presentation +
		website * pieceCredits.website;
	const pieces = image + videoMinutes + script + audioMinutes + presentation + website;
	const planId = pieces > 0 ? recommendPlan(credits) : null;
	const plan = plans.find((item) => item.id === planId);
	const href = planId ? signupUrlForPlan(planId) : signupUrlForPlan('start');

	const result = useMemo(() => {
		if (!planId) return null;
		if (planId === 'enterprise') {
			return { name: planNames.enterprise, price: null as string | null, unit: null as string | null };
		}
		if (!plan) return null;
		return {
			name: planNames[plan.id],
			price: formatUsd(plan.monthlyUsd),
			unit: formatUsd(creditUnitUsd(plan.monthlyUsd, plan.credits)),
		};
	}, [plan, planId, planNames]);

	return (
		<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
			<div className="flex flex-col gap-8 rounded-2xl bg-gradient-to-br from-ink-200 to-ink-100 p-6">
				<Slider
					id="pieces-image"
					label={copy.image}
					value={image}
					max={limits.image}
					onChange={setImage}
					icon={<Image size={16} className="text-feature-image" aria-hidden="true" />}
				/>
				<Slider
					id="pieces-video"
					label={copy.video}
					value={videoMinutes}
					max={limits.videoMinutes}
					onChange={setVideoMinutes}
					unit={copy.minutes}
					icon={<Clapperboard size={16} className="text-feature-video" aria-hidden="true" />}
				/>
				<Slider
					id="pieces-script"
					label={copy.script}
					value={script}
					max={limits.script}
					onChange={setScript}
					icon={<ScrollText size={16} className="text-feature-script" aria-hidden="true" />}
				/>
				<Slider
					id="pieces-audio"
					label={copy.audio}
					value={audioMinutes}
					max={limits.audioMinutes}
					onChange={setAudioMinutes}
					unit={copy.minutes}
					icon={<AudioLines size={16} className="text-feature-audio" aria-hidden="true" />}
				/>
				<Slider
					id="pieces-presentation"
					label={copy.presentation}
					value={presentation}
					max={limits.presentation}
					onChange={setPresentation}
					icon={<Presentation size={16} className="text-feature-presentation" aria-hidden="true" />}
				/>
				<Slider
					id="pieces-website"
					label={copy.website}
					value={website}
					max={limits.website}
					onChange={setWebsite}
					icon={<Globe size={16} className="text-primary-300" aria-hidden="true" />}
				/>
			</div>

			<div className="flex flex-col justify-between gap-6 rounded-2xl bg-gradient-to-b from-primary-800 to-ink-200 p-6" aria-live="polite">
				{pieces === 0 || !result ? (
					<p className="text-base text-pretty text-neutral-200">{copy.empty}</p>
				) : (
					<div className="flex flex-col gap-2">
						<p className="text-sm text-primary-200">{copy.planLabel}</p>
						<p className="font-display text-4xl font-semibold text-white">{result.name}</p>
						{result.price ? (
							<p className="text-lg text-white">
								{result.price} {copy.perMonth}
							</p>
						) : (
							<p className="text-base text-pretty text-neutral-200">{copy.enterprise}</p>
						)}
						<p className="mt-4 text-sm text-neutral-300">{copy.creditsLabel}</p>
						<p className="font-display text-3xl font-semibold">{credits.toLocaleString('en-US')}</p>
						{result.unit ? (
							<p className="text-sm text-neutral-300">
								{copy.unitLabel}: {result.unit}
							</p>
						) : null}
					</div>
				)}
				<a
					href={href}
					data-plan={planId ?? 'start'}
					onClick={() => writePlanCookie(planId ?? 'start')}
					aria-disabled={pieces === 0}
					className={`inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 font-display text-base font-semibold text-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98] ${pieces === 0 ? 'pointer-events-none opacity-40' : ''}`}
				>
					{copy.cta}
				</a>
			</div>
			<p className="text-sm text-pretty text-neutral-400 lg:col-span-2">{copy.assumption}</p>
		</div>
	);
}
