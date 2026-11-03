import OpenAI from 'openai';
import { z } from 'zod';
import { slugify } from '../features/posts/post.schema';
import { getEnv } from './env';

type Named = { name: string; nameEn: string | null; slug: string };

const rawSchema = z.object({
	category: z.object({
		slug: z.string().nullable().optional(),
		name: z.string().trim().min(2).max(60),
		nameEn: z.string().trim().min(2).max(60),
	}),
	tags: z.array(z.object({ name: z.string().trim().min(2).max(50), nameEn: z.string().trim().min(2).max(50) })).max(10),
});

export type Classification = {
	/** Existing category to reuse, or a new one to create (isNew). */
	category: { slug: string; name: string; nameEn: string; isNew: boolean };
	tags: { slug: string; name: string; nameEn: string }[];
};

export type ClassifyInput = { title: string; excerpt: string; markdown: string; otherTitle?: string };

const MAX_TAGS = 6;

/**
 * Turn the model answer into something safe to store: reuse an existing category whenever the slug or
 * the name matches one, otherwise create it; dedupe tags by slug and drop tags equal to the category.
 */
export function resolveClassification(raw: unknown, categories: Named[]): Classification {
	const parsed = rawSchema.parse(raw);
	const bySlug = new Map(categories.map((category) => [category.slug, category]));
	const match =
		(parsed.category.slug && bySlug.get(parsed.category.slug)) ||
		bySlug.get(slugify(parsed.category.name)) ||
		categories.find((category) => category.nameEn && slugify(category.nameEn) === slugify(parsed.category.nameEn));
	const category = match
		? { slug: match.slug, name: match.name, nameEn: match.nameEn ?? parsed.category.nameEn, isNew: false }
		: { slug: slugify(parsed.category.name), name: parsed.category.name, nameEn: parsed.category.nameEn, isNew: true };
	if (!category.slug) throw new Error('La IA devolvió una categoría vacía.');

	const seen = new Set<string>([category.slug]);
	const tags: Classification['tags'] = [];
	for (const tag of parsed.tags) {
		const slug = slugify(tag.name);
		if (!slug || seen.has(slug)) continue;
		seen.add(slug);
		tags.push({ slug, name: tag.name, nameEn: tag.nameEn });
		if (tags.length === MAX_TAGS) break;
	}
	return { category, tags };
}

const SYSTEM = `You classify blog articles for Kaiman Studio, an AI marketing tool for small businesses.

CATEGORY = the business sector the article is written for (exactly one).
- Choose an existing category whenever the article's target business fits it, and return its slug.
- Only if none fits, invent a new sector category: a short plural noun phrase with the same granularity as the existing ones (for example "Gimnasios" / "Gyms", "Clínicas dentales" / "Dental clinics"). Return slug null. Never create a near-duplicate of an existing category.

TAGS = 3 to ${MAX_TAGS} marketing topics the article covers (for example: membresías, fidelización, testimonios, promociones de temporada, reseñas, redes sociales).
- 1 to 3 words each, lowercase except proper nouns.
- Reuse an existing tag whenever it means the same thing, with its exact names.
- Do not use the sector, "IA", "inteligencia artificial", "marketing" or "Kaiman" as tags: every article is about them.

Spanish and English names for everything. Return only JSON:
{"category":{"slug":string|null,"name":"<Spanish>","nameEn":"<English>"},"tags":[{"name":"<Spanish>","nameEn":"<English>"}]}`;

export async function classifyPost(input: ClassifyInput, categories: Named[], tags: Named[]): Promise<Classification> {
	const apiKey = getEnv('OPENAI_API_KEY');
	if (!apiKey) throw new Error('OPENAI_API_KEY no está configurada.');
	const client = new OpenAI({ apiKey, timeout: 60_000, maxRetries: 1 });
	const response = await client.chat.completions.create({
		model: 'gpt-4o-mini',
		temperature: 0.2,
		response_format: { type: 'json_object' },
		messages: [
			{ role: 'system', content: SYSTEM },
			{
				role: 'user',
				content: JSON.stringify({
					existingCategories: categories.map(({ slug, name, nameEn }) => ({ slug, name, nameEn })),
					existingTags: tags.map(({ name, nameEn }) => ({ name, nameEn })),
					article: { title: input.title, otherLanguageTitle: input.otherTitle, summary: input.excerpt, body: input.markdown.slice(0, 6000) },
				}),
			},
		],
	});
	const content = response.choices[0]?.message?.content;
	if (!content) throw new Error('La IA no devolvió categoría ni etiquetas.');
	return resolveClassification(JSON.parse(content), categories);
}
