import type { ImportLocale } from './word-import';

/** Recognize only standalone production labels; ordinary headings and text stay intact. */
export function editorialMarker(block: string, locale: ImportLocale): string | null {
	const trimmed = block.trim();
	const wrapped = /^(?:__|\*\*)([\s\S]*?)(?:__|\*\*)$/.exec(trimmed);
	if (!wrapped || wrapped[1].includes('\n')) return null;
	const label = wrapped[1].replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1').trim().replace(/\s+/g, ' ').toUpperCase();
	if (/^FAQ\s*:?$/.test(label)) return locale === 'es' ? '## Preguntas frecuentes' : '## Frequently asked questions';
	if (/^(?:KEY TAKEAWAY|INTRODUCTION|STAT HIGHLIGHT|PULL QUOTE|SECTION\s+\d+\s*[—–-]\s*KEY POINTS|CLOSING CTA\s*[—–-]\s*(?:HOOK LINE|HEADLINE))\s*:$/.test(label)) return '';
	return null;
}

/** Filter legacy imported labels only while rendering; do not modify stored Markdown. */
export function cleanEditorialMarkdown(markdown: string, locale: ImportLocale) {
	let fence: { char: string; length: number } | null = null;
	return markdown.split(/(\n\s*\n)/).map((block) => {
		let containsFence = !!fence;
		for (const line of block.split('\n')) {
			const match = /^ {0,3}(`{3,}|~{3,})/.exec(line);
			if (!match) continue;
			containsFence = true;
			if (!fence) fence = { char: match[1][0], length: match[1].length };
			else if (match[1][0] === fence.char && match[1].length >= fence.length) fence = null;
		}
		if (containsFence) return block;
		return editorialMarker(block, locale) ?? block;
	}).join('');
}
