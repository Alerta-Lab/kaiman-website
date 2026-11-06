import type { APIRoute } from 'astro';
import mammoth from 'mammoth';
import { detectUnlabelledLanguage, parseWordMarkdown } from '../../../features/posts/word-import';

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.admin) return Response.json({ error: 'No autorizado.' }, { status: 401 });
	try {
		const form = await request.formData();
		const file = form.get('document');
		if (!(file instanceof File) || !/\.docx$/i.test(file.name) || file.size === 0 || file.size > 4 * 1024 * 1024) {
			return Response.json({ error: 'Selecciona un archivo .docx de hasta 4 MB.' }, { status: 400 });
		}
		// Mammoth exposes this converter at runtime but omits it from its TypeScript declarations.
		const converter = mammoth as typeof mammoth & { convertToMarkdown(input: { buffer: Buffer }): Promise<{ value: string; messages: { message: string }[] }> };
		const result = await converter.convertToMarkdown({ buffer: Buffer.from(await file.arrayBuffer()) });
		let topics = parseWordMarkdown(result.value);
		if (!topics.some((topic) => topic.versions.length)) {
			const detected = detectUnlabelledLanguage(result.value);
			if (detected) {
				topics = parseWordMarkdown(`## ${detected === 'es' ? 'SPANISH' : 'ENGLISH'} VERSION\n\n${result.value}`);
				topics[0]?.versions[0]?.warnings.push(`Idioma ${detected.toUpperCase()} detectado automáticamente; compruébalo antes de guardar.`);
			}
		}
		if (!topics.length || topics.every((topic) => !topic.versions.length)) {
			return Response.json({ error: 'No se detectaron versiones etiquetadas en el documento. No se ha importado contenido.' }, { status: 422 });
		}
		return Response.json({ topics, warnings: result.messages.map((message) => message.message) });
	} catch (error) {
		console.error('[preview-word]', error);
		return Response.json({ error: 'No se pudo leer el Word. Comprueba el archivo y vuelve a intentarlo.' }, { status: 422 });
	}
};
