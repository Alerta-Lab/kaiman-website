import type { APIRoute } from 'astro';
import { getPostById, getSiblingPost, upsertTranslationDraft } from '../../../../../server/repositories/posts';
import type { ContentLocale } from '../../../../../server/db/schema';
import { translatePostContent } from '../../../../../server/translate-post';

export const POST: APIRoute = async ({ params, locals }) => {
	if (!locals.admin) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
	const id = params.id;
	if (!id) return new Response(JSON.stringify({ error: 'Falta el id' }), { status: 400 });

	try {
		const source = await getPostById(id);
		if (!source) return new Response(JSON.stringify({ error: 'Artículo no encontrado' }), { status: 404 });

		const targetLocale: ContentLocale = source.locale === 'es' ? 'en' : 'es';
		if (await getSiblingPost(source.translationGroupId, targetLocale)) {
			return Response.json({ error: 'Ya existe un artículo en ese idioma. Ábrelo para editarlo; no se reemplazó su contenido.' }, { status: 409 });
		}
		const translated = await translatePostContent(source, targetLocale);
		const draft = await upsertTranslationDraft(source, targetLocale, translated, locals.admin.id);

		return new Response(
			JSON.stringify({
				ok: true,
				id: draft.id,
				locale: draft.locale,
				status: draft.status,
				message: `Borrador ${draft.locale.toUpperCase()} listo para revisar.`,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		);
	} catch (error) {
		console.error('[translate-post]', error);
		return new Response(JSON.stringify({ error: 'No se pudo crear la traducción. Comprueba que no exista ya y vuelve a intentarlo.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
