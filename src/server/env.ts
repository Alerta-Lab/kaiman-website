/** Server secrets: prefer process.env (Node/Vercel), then import.meta.env (Vite). */
export function getEnv(name: string): string | undefined {
	const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
	const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
	const value = fromProcess ?? fromImport;
	return value?.trim() ? value.trim() : undefined;
}
