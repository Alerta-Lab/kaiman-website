import { signupUrl } from './plans';

export const planCookieName = 'kaiman_plan';

/** Keep billing's internal scale ID out of public Business registration links. */
function publicPlanCode(planId: string): string {
	return planId === 'scale' ? 'business' : planId;
}

/** Register URL that carries the chosen plan for the app to preselect. */
export function signupUrlForPlan(planId: string): string {
	const url = new URL(signupUrl);
	url.searchParams.set('plan', publicPlanCode(planId));
	return url.toString();
}

/**
 * Stores the plan for a later read on the app.
 * A cookie can only be shared when both sites live under kaimanstudio.ai.
 * The `plan` query on the register link is the handoff that works across hosts.
 */
export function writePlanCookie(planId: string): void {
	const maxAge = 60 * 60 * 24 * 30;
	const base = `${planCookieName}=${encodeURIComponent(publicPlanCode(planId))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
	document.cookie = base;

	const host = window.location.hostname;
	if (host === 'kaimanstudio.ai' || host.endsWith('.kaimanstudio.ai')) {
		document.cookie = `${base}; Domain=.kaimanstudio.ai; Secure`;
	}
}
