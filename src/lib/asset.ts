/** Prefix public asset paths with Astro `base` (needed on GitHub project Pages). */
export function asset(path: string): string {
	const base = import.meta.env.BASE_URL || '/';
	const normalized = path.replace(/^\/+/, '');
	return `${base}${normalized}`;
}
