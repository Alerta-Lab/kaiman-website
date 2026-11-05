/** Prefix public asset paths with Astro `base` (needed on GitHub project Pages). */
export function asset(path: string): string {
	const raw = import.meta.env.BASE_URL || '/';
	const base = raw.endsWith('/') ? raw : `${raw}/`;
	const normalized = path.replace(/^\/+/, '');
	return `${base}${normalized}`;
}
