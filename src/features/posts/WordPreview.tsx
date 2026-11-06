import { useState } from 'react';
import type { ImportedTopic } from './word-import';

type Classified =
	| { category: { name: string; created: boolean }; tags: { name: string }[] }
	| { error: string };

export function WordPreview() {
	const [file, setFile] = useState<File>();
	const [topics, setTopics] = useState<ImportedTopic[]>([]);
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const [notices, setNotices] = useState<string[]>([]);
	const [saved, setSaved] = useState<Record<number, { id: string; locale: string }[]>>({});
	const [classified, setClassified] = useState<Record<number, Classified>>({});
	async function preview() {
		if (!file) { setError('Selecciona un archivo Word.'); return; }
		setBusy(true); setError(''); setTopics([]); setSaved({}); setClassified({});
		try {
			const form = new FormData(); form.append('document', file);
			const response = await fetch('/api/admin/preview-word', { method: 'POST', body: form });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'No se pudo leer el archivo.');
			setTopics(data.topics); setNotices(data.warnings);
		} catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
		finally { setBusy(false); }
	}
	async function save(index: number) {
		setBusy(true); setError('');
		try {
			const response = await fetch('/api/admin/import-topic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versions: topics[index].versions }) });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar el tema.');
			setSaved((current) => ({ ...current, [index]: data.created }));
			setClassified((current) => ({ ...current, [index]: data.classification ?? { error: data.classificationError ?? 'Sin categoría ni etiquetas.' } }));
		} catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
		finally { setBusy(false); }
	}
	function edit(topicIndex: number, versionIndex: number, field: keyof ImportedTopic['versions'][number], value: string) {
		setTopics((current) => current.map((topic, i) => i !== topicIndex ? topic : { ...topic, versions: topic.versions.map((version, j) => j !== versionIndex ? version : { ...version, [field]: value }) }));
	}
	return <div className="space-y-6">
		<section className="rounded-2xl border border-primary-200 bg-white p-6">
			<h2 className="font-headline text-2xl font-bold">Revisar un Word</h2>
			<p className="mt-2">Detecta temas e idiomas sin usar créditos. Revisa y guarda cada tema como borrador. Al guardar, la IA asigna la categoría y las etiquetas (gpt-4o-mini, consumo mínimo).</p>
			<label className="mt-4 block font-bold">Documento .docx<input type="file" accept=".docx" className="mt-2 block" onChange={(event) => setFile(event.target.files?.[0])} /></label>
			<button type="button" onClick={preview} disabled={busy} className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50">{busy ? 'Leyendo…' : 'Analizar documento'}</button>
			{error && <p role="alert" className="mt-4 text-error-700">{error}</p>}
		</section>
		{notices.length > 0 && <p className="text-sm">El documento contiene {notices.length} advertencia(s) de formato. Revisa la vista previa.</p>}
		{topics.map((topic, index) => <section key={index} className="rounded-2xl border border-primary-200 bg-white p-6">
			<h2 className="font-headline text-xl font-bold">{topic.label}</h2>
			{topic.versions.length === 1 && <p className="mt-2">Solo se detectó {topic.versions[0].locale === 'es' ? 'español' : 'inglés'}. Después de guardar puedes solicitar la traducción desde el editor.</p>}
			{topic.versions.map((v, i) => <details key={i} className="mt-4 rounded-lg border border-primary-200 p-4">
				<summary className="cursor-pointer font-bold">{v.locale.toUpperCase()} · {v.title || 'Sin título'}</summary>
				<div className="mt-4 space-y-3">{([['Título', 'title'], ['Slug', 'slug'], ['Título SEO', 'seoTitle'], ['Descripción SEO', 'seoDescription'], ['Entradilla', 'excerpt'], ['Alt de portada', 'coverAlt'], ['Pie de portada', 'coverCaption'], ['Prompt de portada', 'coverPrompt'], ['Alt interior', 'bodyAlt'], ['Pie interior', 'bodyCaption'], ['Prompt interior', 'bodyPrompt'], ['Contenido Markdown', 'markdown']] as const).map(([label, field]) => <label key={field} className="block font-bold">{label}<textarea disabled={Boolean(saved[index])} value={v[field]} onChange={(event) => edit(index, i, field, event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-black/30 p-2 font-normal" /></label>)}</div>
				{v.warnings.length > 0 && <ul className="mt-4 list-disc pl-6 text-error-700">{v.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
			</details>)}
			{classified[index] && <ClassifiedNote result={classified[index]} />}
			{saved[index] ? <p className="mt-4">Borradores guardados: {saved[index].map((post) => <a key={post.id} href={`/admin/posts/${post.id}`} className="mr-4 font-bold text-primary underline">Editar {post.locale.toUpperCase()}</a>)}</p> : <button type="button" disabled={busy} onClick={() => void save(index)} className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50">Guardar borradores de este tema</button>}
		</section>)}
	</div>;
}

function ClassifiedNote({ result }: { result: Classified }) {
	if ('error' in result) return <p role="status" className="mt-4 rounded-lg bg-warning/30 p-3">{result.error}</p>;
	return <p role="status" className="mt-4 rounded-lg bg-primary-100 p-3">
		<strong>Categoría:</strong> {result.category.name}
		{result.category.created && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-sm font-bold text-white">nueva</span>}
		<br /><strong>Etiquetas:</strong> {result.tags.map((tag) => tag.name).join(', ') || 'ninguna'}
		<span className="mt-1 block text-sm text-black/65">Asignadas por IA a las dos versiones. Puedes cambiarlas en el editor.</span>
	</p>;
}
