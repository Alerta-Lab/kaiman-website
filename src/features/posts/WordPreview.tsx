import { useState } from 'react';
import type { ImportedTopic } from './word-import';
import type { Classification } from '../../server/classify-post';

type Classified =
	| { category: { name: string; created: boolean }; tags: { name: string }[] }
	| { error: string };

export function WordPreview() {
	const [file, setFile] = useState<File>();
	const [topics, setTopics] = useState<ImportedTopic[]>([]);
	const [suggestions, setSuggestions] = useState<(Classification | null)[]>([]);
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const [notices, setNotices] = useState<string[]>([]);
	const [sourceMarkdown, setSourceMarkdown] = useState('');
	const [excludedBlocks, setExcludedBlocks] = useState<string[]>([]);
	const [saved, setSaved] = useState<Record<number, { id: string; locale: string }[]>>({});
	const [classified, setClassified] = useState<Record<number, Classified>>({});
	async function preview() {
		if (!file) { setError('Selecciona un archivo Word.'); return; }
		setBusy(true); setError(''); setTopics([]); setSuggestions([]); setSourceMarkdown(''); setExcludedBlocks([]); setSaved({}); setClassified({});
		try {
			const form = new FormData(); form.append('document', file);
			const response = await fetch('/api/admin/preview-word', { method: 'POST', body: form });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'No se pudo leer el archivo.');
			setTopics(data.topics); setSuggestions(data.suggestions); setNotices(data.warnings); setSourceMarkdown(data.sourceMarkdown); setExcludedBlocks(data.excludedBlocks);
		} catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
		finally { setBusy(false); }
	}
	async function save(index: number) {
		setBusy(true); setError('');
		try {
			const response = await fetch('/api/admin/import-topic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versions: topics[index].versions, classification: suggestions[index] ?? null }) });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar el tema.');
			setSaved((current) => ({ ...current, [index]: data.created }));
			setClassified((current) => ({ ...current, [index]: data.classification ?? { error: data.classificationError ?? 'Sin categoría ni palabras clave.' } }));
		} catch (e) { setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
		finally { setBusy(false); }
	}
	function edit(topicIndex: number, versionIndex: number, field: keyof ImportedTopic['versions'][number], value: string) {
		setTopics((current) => current.map((topic, i) => i !== topicIndex ? topic : { ...topic, versions: topic.versions.map((version, j) => j !== versionIndex ? version : { ...version, [field]: value }) }));
	}
	function editSuggestion(index: number, editValue: (suggestion: Classification) => Classification) {
		setSuggestions((current) => current.map((value, i) => i === index && value ? editValue(value) : value));
	}
	return <div className="space-y-6">
		<section className="rounded-2xl border border-primary-200 bg-white p-6">
			<h2 className="font-headline text-2xl font-bold">Revisar un Word</h2>
			<p className="mt-2">La IA analiza el documento y sugiere categoría y palabras clave. Este análisis consume créditos de texto. Revisa las versiones y las sugerencias antes de guardar cada tema como borrador.</p>
			<label className="mt-4 block font-bold">Documento .docx<input type="file" accept=".docx" className="mt-2 block" onChange={(event) => setFile(event.target.files?.[0])} /></label>
			<button type="button" onClick={preview} disabled={busy} className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50">{busy ? 'Leyendo…' : 'Analizar documento'}</button>
			{error && <p role="alert" className="mt-4 text-error-700">{error}</p>}
		</section>
		{Object.keys(saved).length > 0 && <section className="rounded-2xl border border-primary-200 bg-white p-6" aria-label="Temas guardados">
			<h2 className="font-headline text-xl font-bold">Borradores guardados</h2>
			<p className="mt-2 text-sm text-black/70">Los temas guardados salen de la revisión. Puedes abrir sus versiones desde aquí.</p>
			<ul className="mt-4 space-y-3">{Object.entries(saved).map(([key, posts]) => {
				const index = Number(key);
				return <li key={key} className="rounded-lg border border-primary-200 p-3"><strong>{topics[index]?.label ?? 'Artículo'}</strong><div className="mt-2">{posts.map((post) => <a key={post.id} href={`/admin/posts/${post.id}`} className="mr-4 font-bold text-primary underline">Editar {post.locale.toUpperCase()}</a>)}</div>{classified[index] && <ClassifiedNote result={classified[index]} />}</li>;
			})}</ul>
		</section>}
		{notices.length > 0 && <p className="text-sm">El documento contiene {notices.length} advertencia(s) de formato. Revisa la vista previa.</p>}
		{sourceMarkdown && <details className="rounded-lg border border-primary-200 bg-white p-4"><summary className="cursor-pointer font-bold">Revisar el texto original extraído del Word</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm">{sourceMarkdown}</pre></details>}
		{excludedBlocks.length > 0 && <details className="rounded-lg border border-primary-200 bg-white p-4"><summary className="cursor-pointer font-bold">Revisar bloques omitidos o sin identificar ({excludedBlocks.length})</summary><p className="mt-2 text-sm">Estos bloques no se asignaron a campos. Pueden ser rótulos, información general o contenido que necesite revisión. Comprueba que no falte contenido editorial antes de guardar.</p><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm">{excludedBlocks.join('\n\n')}</pre></details>}
		{topics.length > 0 && topics.every((_, index) => Boolean(saved[index])) && <p role="status">Todos los temas de este documento ya se guardaron como borradores.</p>}
		{topics.map((topic, index) => !saved[index] && <section key={index} className="rounded-2xl border border-primary-200 bg-white p-6">
			<h2 className="font-headline text-xl font-bold">{topic.label}</h2>
			{topic.versions.length === 1 && <p className="mt-2">Solo se detectó {topic.versions[0].locale === 'es' ? 'español' : 'inglés'}. Después de guardar puedes solicitar la traducción desde el editor.</p>}
			{suggestions[index] ? <fieldset disabled={Boolean(saved[index]) || busy} className="mt-4 space-y-3 rounded-lg border border-primary-200 p-4">
				<legend className="px-1 font-bold">Sugerencias de clasificación</legend>
				<p className="text-sm text-black/70">Revisa o edita el sector y las palabras clave en ambos idiomas antes de guardar. Se aplicarán a las versiones de este tema.</p>
				<div className="grid gap-3 sm:grid-cols-2">{(['name', 'nameEn'] as const).map((field) => <label key={field} className="block font-bold">Categoría ({field === 'name' ? 'ES' : 'EN'})<input className="mt-1 w-full rounded-lg border border-black/30 p-2 font-normal" maxLength={60} value={suggestions[index]!.category[field]} onChange={(event) => editSuggestion(index, (current) => ({ ...current, category: { ...current.category, [field]: event.target.value, slug: '' } }))} /></label>)}</div>
				<p className="font-bold">Palabras clave</p>
				{suggestions[index]!.tags.map((tag, tagIndex) => <div key={tagIndex} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">{(['name', 'nameEn'] as const).map((field) => <label key={field} className="block text-sm font-bold">{field === 'name' ? 'Español' : 'Inglés'}<input className="mt-1 w-full rounded-lg border border-black/30 p-2 font-normal" maxLength={50} value={tag[field]} onChange={(event) => editSuggestion(index, (current) => ({ ...current, tags: current.tags.map((value, i) => i === tagIndex ? { ...value, [field]: event.target.value } : value) }))} /></label>)}<button type="button" aria-label={`Quitar palabra clave ${tag.name}`} onClick={() => editSuggestion(index, (current) => ({ ...current, tags: current.tags.filter((_, i) => i !== tagIndex) }))} className="min-h-11 self-end rounded-lg border border-black/20 px-3">Quitar</button></div>)}
				<button type="button" disabled={suggestions[index]!.tags.length >= 6} onClick={() => editSuggestion(index, (current) => ({ ...current, tags: [...current.tags, { name: '', nameEn: '', slug: '' }] }))} className="min-h-11 rounded-lg border border-primary-700 px-3 font-bold text-primary-800 disabled:opacity-50">Agregar palabra clave</button>
			</fieldset> : <p role="status" className="mt-4 rounded-lg bg-warning/30 p-3">No se pudieron sugerir la categoría y las palabras clave. Puedes guardar sin ellas y asignarlas después en el editor.</p>}
			{topic.versions.map((v, i) => <details key={i} className="mt-4 rounded-lg border border-primary-200 p-4">
				<summary className="cursor-pointer font-bold">{v.locale.toUpperCase()} · {v.title || 'Sin título'}</summary>
				<div className="mt-4 space-y-3">{([['Título', 'title'], ['Slug', 'slug'], ['Título SEO', 'seoTitle'], ['Descripción SEO', 'seoDescription'], ['Entradilla', 'excerpt'], ['Alt de portada', 'coverAlt'], ['Pie de portada', 'coverCaption'], ['Prompt de portada', 'coverPrompt'], ['Alt interior', 'bodyAlt'], ['Pie interior', 'bodyCaption'], ['Prompt interior', 'bodyPrompt'], ['Contenido Markdown', 'markdown']] as const).map(([label, field]) => <label key={field} className="block font-bold">{label}<textarea disabled={Boolean(saved[index])} value={v[field]} onChange={(event) => edit(index, i, field, event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-black/30 p-2 font-normal" /></label>)}</div>
				{v.warnings.length > 0 && <ul className="mt-4 list-disc pl-6 text-error-700">{v.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
			</details>)}
			<button type="button" disabled={busy} onClick={() => void save(index)} className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50">Guardar borradores de este tema</button>
		</section>)}
	</div>;
}

function ClassifiedNote({ result }: { result: Classified }) {
	if ('error' in result) return <p role="status" className="mt-4 rounded-lg bg-warning/30 p-3">{result.error}</p>;
	return <p role="status" className="mt-4 rounded-lg bg-primary-100 p-3">
		<strong>Categoría:</strong> {result.category.name}
		{result.category.created && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-sm font-bold text-white">nueva</span>}
		<br /><strong>Palabras clave:</strong> {result.tags.map((tag) => tag.name).join(', ') || 'ninguna'}
		<span className="mt-1 block text-sm text-black/65">Aplicadas a las versiones guardadas. Puedes cambiarlas en el editor.</span>
	</p>;
}
