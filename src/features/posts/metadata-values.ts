const labels = {
	title: 'TITLE|TÍTULO|TITULO',
	slug: 'SLUG',
	excerpt: 'LEDE|LEAD|ENTRADILLA',
	seoTitle: 'META[ _-]+TITLE|SEO[ _-]+TITLE|T[ÍI]TULO\\s+SEO',
	seoDescription: 'META[ _-]+DESCRIPTION|SEO[ _-]+DESCRIPTION|DESCRIPCI[ÓO]N\\s+SEO',
} as const;

/** Strip only a matching, explicit field prefix; preserve the complete value. */
export function cleanMetadataValue(value: string, field: string) {
	if (!Object.hasOwn(labels, field)) return value;
	const label = labels[field as keyof typeof labels];
	const prefix = new RegExp(`^(?:\\*\\*|__)?(?:${label})\\s*(?:\\*\\*|__)?\\s*:\\s*(?:\\*\\*|__)?\\s*`, 'i');
	let result = value.trim();
	if (!prefix.test(result)) return value;
	result = result.replace(/^(\*\*|__)([\s\S]*)\1$/, '$2');
	return result.replace(prefix, '').trim();
}
