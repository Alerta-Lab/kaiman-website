type KeywordOption = { name: string; nameEn: string | null };
const key = (value: string) => value.trim().toLocaleLowerCase();

/** Include a pending entry on save so typing a keyword is never silently discarded. */
export function keywordsForSave(selected: string[], pending: string, options: KeywordOption[], locale: 'es' | 'en') {
	const value = pending.trim();
	if (!value) return selected;
	if (value.length < 2 || value.length > 50 || value.includes(',')) throw new Error('Agrega una palabra clave de 2 a 50 caracteres, sin comas.');
	const match = options.find((option) => [option.name, option.nameEn].some((name) => name && key(name) === key(value)));
	const label = match ? (locale === 'en' && match.nameEn ? match.nameEn : match.name) : value;
	if (selected.some((name) => key(name) === key(label))) return selected;
	if (selected.length >= 8) throw new Error('Solo puedes guardar hasta 8 palabras clave. Quita una o borra la búsqueda pendiente.');
	return [...selected, label];
}
