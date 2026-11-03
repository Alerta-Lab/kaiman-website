/** Customer-facing plans from the public Kaiman Studio pricing. */
export const plans = [
	{
		id: 'start',
		monthlyUsd: 49,
		credits: 500,
		seats: 1,
		storageGb: 1,
		brands: 1,
	},
	{
		id: 'pro',
		monthlyUsd: 99,
		credits: 1500,
		seats: 3,
		storageGb: 3,
		brands: 3,
	},
	{
		id: 'scale',
		monthlyUsd: 199,
		credits: 2500,
		seats: 5,
		storageGb: 5,
		brands: 5,
	},
] as const;

export type PlanId = (typeof plans)[number]['id'] | 'enterprise';

export type Plan = (typeof plans)[number];

/** One-time credit packs from the platform billing catalog. */
export const creditPacks = [
	{ id: 'xs', credits: 100, usd: 19.99 },
	{ id: 's', credits: 250, usd: 49.99 },
	{ id: 'm', credits: 500, usd: 89.99 },
	{ id: 'l', credits: 1000, usd: 169.99 },
	{ id: 'xl', credits: 2500, usd: 399.99 },
] as const;

/**
 * Reference weights for the monthly piece estimator.
 * Video: 3 credits per second. Audio/voice: 2 credits per minute.
 * Presentation and website use sizing weights for plan recommendation.
 */
export const pieceCredits = {
	image: 1,
	script: 1,
	presentation: 5,
	website: 15,
	creditsPerAudioMinute: 2,
	videoShortSeconds: 5,
	videoMediumSeconds: 15,
	creditsPerVideoSecond: 3,
} as const;

export const signupUrl = 'https://app.kaimanstudio.ai/auth/register';
export const loginUrl = 'https://app.kaimanstudio.ai/auth/login';
export const instagramUrl = 'https://www.instagram.com/kaimanstudioai';
export const alertaUrl = 'https://wearealerta.com/';

export function creditUnitUsd(monthlyUsd: number, credits: number): number {
	return monthlyUsd / credits;
}

export function formatUsd(value: number): string {
	const cents = Math.round(value * 100) % 100 !== 0;
	const tiny = value > 0 && value < 1;
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: tiny ? 2 : cents ? 2 : 0,
		maximumFractionDigits: tiny ? 4 : cents ? 2 : 0,
	}).format(value);
}

export function recommendPlan(credits: number): PlanId {
	const match = plans.find((plan) => credits <= plan.credits);
	return match?.id ?? 'enterprise';
}
