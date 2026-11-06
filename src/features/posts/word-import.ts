export type ImportLocale = 'es' | 'en';
export type ImportedVersion = {
	locale: ImportLocale;
	title: string;
	slug: string;
	excerpt: string;
	seoTitle: string;
	seoDescription: string;
	coverAlt: string;
	coverCaption: string;
	coverPrompt: string;
	bodyAlt: string;
	bodyCaption: string;
	bodyPrompt: string;
	markdown: string;
	warnings: string[];
};
export type ImportedTopic = { label: string; versions: ImportedVersion[] };

export function detectUnlabelledLanguage(text: string): ImportLocale | null {
	const words = text.toLowerCase().match(/[a-záéíóúñ]+/g) ?? [];
	const counts = { es: 0, en: 0 };
	for (const word of words) {
		if (['el', 'la', 'los', 'las', 'para', 'con', 'una', 'del', 'que', 'por'].includes(word)) counts.es++;
		if (['the', 'and', 'for', 'with', 'from', 'your', 'that', 'this', 'are', 'how'].includes(word)) counts.en++;
	}
	if (counts.es >= 4 && counts.es >= counts.en * 2) return 'es';
	if (counts.en >= 4 && counts.en >= counts.es * 2) return 'en';
	return null;
}

const labels: Record<string, keyof ImportedVersion | 'takeaway' | 'intro' | 'quote' | 'faq' | 'ctaHook' | 'ctaHeadline'> = {
	'TITLE': 'title', 'SLUG': 'slug', 'META TITLE': 'seoTitle', 'META DESCRIPTION': 'seoDescription',
	'LEDE': 'excerpt', 'HERO ALT TEXT': 'coverAlt', 'HERO CAPTION': 'coverCaption', 'HERO IMAGE PROMPT': 'coverPrompt',
	'KEY TAKEAWAY': 'takeaway', 'INTRODUCTION': 'intro', 'PULL QUOTE': 'quote', 'FAQ': 'faq',
	'IN-ARTICLE IMAGE — PROMPT': 'bodyPrompt', 'IN-ARTICLE IMAGE — ALT TEXT': 'bodyAlt', 'IN-ARTICLE IMAGE — CAPTION': 'bodyCaption',
	'CLOSING CTA — HOOK LINE': 'ctaHook', 'CLOSING CTA — HEADLINE': 'ctaHeadline',
};

const plain = (s: string) => s.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1').replace(/^(?:\*\*|__|\*|_)(.*?)(?:\*\*|__|\*|_)$/s, '$1').trim();
const normalized = (s: string) => plain(s.replace(/^#{1,6}\s+/, '')).toUpperCase().replace(/\s+/g, ' ');

/** Parse the explicitly labelled weekly format; unknown structure is reported, never silently converted. */
export function parseWordMarkdown(markdown: string): ImportedTopic[] {
	const blocks = markdown.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
	const topics: ImportedTopic[] = [];
	let topic: ImportedTopic | undefined;
	let version: ImportedVersion | undefined;
	let field: string | undefined;
	const body: string[] = [];
	const finish = () => {
		if (!version) return;
		version.markdown = body.join('\n\n').trim();
		for (const [name, value] of [['título', version.title], ['slug', version.slug], ['entradilla', version.excerpt], ['título SEO', version.seoTitle], ['descripción SEO', version.seoDescription], ['contenido', version.markdown]] as const) {
			if (!value) version.warnings.push(`Falta ${name}.`);
		}
		body.length = 0;
	};
	for (const block of blocks) {
		const key = normalized(block);
		if (/^TOPIC\s+\d+\b/.test(key)) { finish(); version = undefined; topic = { label: plain(block.replace(/^#+\s*/, '')), versions: [] }; topics.push(topic); field = undefined; continue; }
		const lang = /^(ENGLISH VERSION|SPANISH\s*\/\s*ESPAÑOL VERSION|SPANISH VERSION|ESPAÑOL VERSION)$/.exec(key);
		if (lang) {
			finish();
			topic ??= { label: 'Artículo', versions: [] };
			if (!topics.includes(topic)) topics.push(topic);
			const locale: ImportLocale = key.startsWith('ENGLISH') ? 'en' : 'es';
			version = { locale, title: '', slug: '', excerpt: '', seoTitle: '', seoDescription: '', coverAlt: '', coverCaption: '', coverPrompt: '', bodyAlt: '', bodyCaption: '', bodyPrompt: '', markdown: '', warnings: [] };
			if (topic.versions.some((v) => v.locale === locale)) version.warnings.push('Idioma duplicado en el mismo tema.');
			topic.versions.push(version); field = undefined; continue;
		}
		if (!version) continue;
		if (labels[key]) { field = labels[key]; if (field === 'faq') body.push('## FAQ'); if (field === 'bodyPrompt') body.push('[IMAGEN_INTERIOR]'); continue; }
		if (/^SECTION\s+\d+\s*[—–-]/.test(key)) { field = 'section'; body.push(`## ${plain(block.replace(/^#+\s*/, '')).replace(/^SECTION\s+\d+\s*[—–-]\s*/i, '')}`); continue; }
		if (field && ['title', 'slug', 'excerpt', 'seoTitle', 'seoDescription', 'coverAlt', 'coverCaption', 'coverPrompt', 'bodyAlt', 'bodyCaption', 'bodyPrompt'].includes(field)) {
			const f = field as 'title' | 'slug' | 'excerpt' | 'seoTitle' | 'seoDescription' | 'coverAlt' | 'coverCaption' | 'coverPrompt' | 'bodyAlt' | 'bodyCaption' | 'bodyPrompt';
			version[f] += `${version[f] ? '\n\n' : ''}${plain(block)}`; continue;
		}
		if (field === 'takeaway') body.push(`> ${plain(block).replace(/\n/g, '\n> ')}`);
		else if (field === 'quote') body.push(`> ${plain(block).replace(/\n/g, '\n> ')}`);
		else if (field === 'ctaHook' || field === 'ctaHeadline') body.push(plain(block));
		else if (field) body.push(block);
		else version.warnings.push('Hay contenido sin identificar; revisa el documento.');
	}
	finish();
	return topics;
}
