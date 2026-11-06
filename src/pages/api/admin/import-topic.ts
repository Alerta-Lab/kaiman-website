import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { classifyTranslationGroup } from '../../../server/auto-classify';
import { saveImportedTopic } from '../../../server/import-posts';
import { resolveClassification, type Classification } from '../../../server/classify-post';
import { applyClassification, listCategories, listTags } from '../../../server/repositories/posts';

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	let saved: Awaited<ReturnType<typeof saveImportedTopic>>;
	let body: { classification?: unknown };
	let reviewed: Classification | null | undefined;
	try {
		body = await request.json();
		if (body.classification !== undefined) {
			if (body.classification === null) reviewed = null;
			else {
				const [categories, tags] = await Promise.all([listCategories(), listTags()]);
				reviewed = resolveClassification(body.classification, categories);
				const requested = body.classification as { category: { name: string; nameEn: string } };
				if (!reviewed.category.isNew && (requested.category.name.trim().toLocaleLowerCase() !== reviewed.category.name.toLocaleLowerCase() || requested.category.nameEn.trim().toLocaleLowerCase() !== reviewed.category.nameEn.toLocaleLowerCase())) {
					return Response.json({ error: `La categoría «${reviewed.category.name}» ya existe con otros nombres. Usa los nombres existentes o edítalos en Categorías.` }, { status: 400 });
				}
				const conflictingTag = reviewed.tags.find((tag) => {
					const existing = tags.find((item) => item.slug === tag.slug);
					return existing?.nameEn && existing.nameEn.toLocaleLowerCase() !== tag.nameEn.toLocaleLowerCase();
				});
				if (conflictingTag) return Response.json({ error: `La palabra clave «${conflictingTag.name}» ya existe con otra traducción. Usa la traducción existente o edítala en Palabras clave.` }, { status: 400 });
			}
		}
		saved = await saveImportedTopic(body, locals.admin.id);
	} catch (error) {
		if (error instanceof ZodError) return Response.json({ error: 'Revisa los campos obligatorios y los formatos antes de guardar.', issues: error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
		console.error('[import-topic]', error);
		return Response.json({ error: 'No se pudo guardar el tema. Comprueba que los slugs no estén en uso y que la base de datos esté actualizada.' }, { status: 409 });
	}
	// The drafts are already saved: a classification failure only leaves them without category and tags.
	try {
		if (reviewed === null) return Response.json({ created: saved.created, classification: null, classificationError: 'Los borradores se guardaron sin categoría ni palabras clave; puedes asignarlas en el editor.' }, { status: 201 });
		if (reviewed) {
			const applied = await applyClassification(saved.translationGroupId, reviewed);
			return Response.json({ created: saved.created, classification: { category: { name: applied.category.name, nameEn: applied.category.nameEn, slug: applied.category.slug, created: applied.categoryCreated }, tags: reviewed.tags } }, { status: 201 });
		}
		const classification = await classifyTranslationGroup(saved.translationGroupId);
		return Response.json({ created: saved.created, classification }, { status: 201 });
	} catch (error) {
		console.error('[import-topic classify]', error);
		return Response.json({ created: saved.created, classification: null, classificationError: 'Los borradores se guardaron, pero no se pudieron aplicar la categoría y las palabras clave. Revísalas en el editor.' }, { status: 201 });
	}
};
