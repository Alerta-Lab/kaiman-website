import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { classifyTranslationGroup } from '../../../server/auto-classify';
import { saveImportedTopic } from '../../../server/import-posts';

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	let saved: Awaited<ReturnType<typeof saveImportedTopic>>;
	try {
		saved = await saveImportedTopic(await request.json(), locals.admin.id);
	} catch (error) {
		if (error instanceof ZodError) return Response.json({ error: 'Revisa los campos obligatorios y los formatos antes de guardar.', issues: error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
		console.error('[import-topic]', error);
		return Response.json({ error: 'No se pudo guardar el tema. Comprueba que los slugs no estén en uso y que la base de datos esté actualizada.' }, { status: 409 });
	}
	// The drafts are already saved: a classification failure only leaves them without category and tags.
	try {
		const classification = await classifyTranslationGroup(saved.translationGroupId);
		return Response.json({ created: saved.created, classification }, { status: 201 });
	} catch (error) {
		console.error('[import-topic classify]', error);
		return Response.json({ created: saved.created, classification: null, classificationError: 'Los borradores se guardaron, pero la IA no pudo asignar categoría y palabras clave. Usa «Sugerir con IA» en el editor.' }, { status: 201 });
	}
};
