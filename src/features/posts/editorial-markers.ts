import type { ImportLocale } from './word-import';

/** Compare standalone labels regardless of Word's emphasis, escapes or heading style. */
export function editorialLabel(block: string): string {
	let text = block.trim().replace(/^#{1,6}\s+/, '').replace(/\\([\p{P}\p{S}])/gu, '$1');
	for (let i = 0; i < 3; i++) text = text.replace(/^(\*\*|__|\*|_)(.*?)\1$/, '$2').trim();
	return text.replace(/:$/, '').trim();
}

export function closingCtaPart(block: string): 'hook-line' | 'headline' | null {
	const match = /^CLOSING CTA\s*[—–-]\s*(HOOK LINE|HEADLINE)$/i.exec(editorialLabel(block));
	return match ? (match[1].toUpperCase() === 'HEADLINE' ? 'headline' : 'hook-line') : null;
}

const metadataLabels = {
	'TITLE': 'title', 'SLUG': 'slug', 'META TITLE': 'seoTitle', 'META DESCRIPTION': 'seoDescription',
	'LEDE': 'excerpt', 'HERO ALT TEXT': 'coverAlt', 'HERO CAPTION': 'coverCaption', 'HERO PROMPT': 'coverPrompt',
	'IN-ARTICLE IMAGE — PROMPT': 'bodyPrompt', 'IN-ARTICLE IMAGE — ALT TEXT': 'bodyAlt', 'IN-ARTICLE IMAGE — CAPTION': 'bodyCaption',
} as const;

export function editorialMetadataField(block: string) {
	const label = editorialLabel(block).toUpperCase().replace(/\s*[–—-]\s*/g, '-').replace(/^IN-ARTICLE IMAGE-/, 'IN-ARTICLE IMAGE — ');
	return metadataLabels[label as keyof typeof metadataLabels] ?? null;
}

/** Recognize only standalone production labels; ordinary headings and text stay intact. */
export function editorialMarker(block: string, locale: ImportLocale): string | null {
	const original = editorialLabel(block);
	if (original.includes('\n')) return null;
	const label = original.toUpperCase();
	const languageHeading = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	if (/^(?:VERSION EN ESPANOL|SPANISH VERSION|ENGLISH VERSION|VERSION EN INGLES|\[?(?:ESPANOL|ENGLISH)\]?)$/.test(languageHeading)) return '';
	if (editorialMetadataField(block)) return '';
	if (/^(?:Midjourney[- ]style prompt|Prompt estilo Midjourney)\s*:/i.test(original)) return '';
	if (/^FAQ\s*:?$/.test(label)) return locale === 'es' ? '## Preguntas frecuentes' : '## Frequently asked questions';
	if (/^(?:KEY TAKEAWAY|INTRODUCTION|STAT HIGHLIGHT|PULL QUOTE|SECTION\s+\d+\s*[—–-]\s*KEY POINTS)$/.test(label) || closingCtaPart(block)) return '';
	const section = /^SECTION\s+\d+\s*[—–-]\s*(.+)$/i.exec(original);
	if (section) return `## ${section[1]}`;
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
