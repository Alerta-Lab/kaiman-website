import { useId, useState } from 'react';

/** Upload to the existing media library; attaching the image is saved with the article. */
export function ImageUpload({ locale, label, disabled, onUploaded, onBusyChange }: { locale: 'es' | 'en'; label: string; disabled?: boolean; onUploaded: (url: string, alt: string) => void; onBusyChange?: (busy: boolean) => void }) {
	const id = useId();
	const [file, setFile] = useState<File | null>(null);
	const [alt, setAlt] = useState('');
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const en = locale === 'en';
	const upload = async () => {
		if (!file || !alt.trim() || busy) return;
		if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) { setMessage(en ? 'Choose an image up to 4 MB.' : 'Selecciona una imagen de hasta 4 MB.'); return; }
		setBusy(true); onBusyChange?.(true); setMessage('');
		try {
			const form = new FormData(); form.set('image', file); form.set('alt', alt.trim());
			const response = await fetch('/api/admin/media', { method: 'POST', body: form });
			const result = await response.json() as { url?: string; error?: string };
			if (!response.ok || !result.url) throw new Error(result.error || (en ? 'Could not upload the image.' : 'No se pudo subir la imagen.'));
			onUploaded(result.url, alt.trim());
			setMessage(en ? 'Image uploaded. Save the article to apply it.' : 'Imagen subida. Guarda el artículo para aplicarla.');
		} catch (error) { setMessage(error instanceof Error ? error.message : (en ? 'Could not upload the image.' : 'No se pudo subir la imagen.')); }
		finally { setBusy(false); onBusyChange?.(false); }
	};
	return <fieldset disabled={disabled || busy} className="mt-3 space-y-2 rounded-lg border border-primary-200 p-4 disabled:opacity-60">
		<legend className="px-1 text-sm font-bold">{label}</legend>
		<label htmlFor={`${id}-file`} className="block text-sm font-medium">{en ? 'Image file (up to 4 MB)' : 'Archivo de imagen (hasta 4 MB)'}</label>
		<input id={`${id}-file`} type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-sm" />
		<label htmlFor={`${id}-alt`} className="block text-sm font-medium">{en ? 'Alternative text' : 'Texto alternativo'}</label>
		<input id={`${id}-alt`} value={alt} maxLength={160} onChange={(event) => setAlt(event.target.value)} className="min-h-11 w-full rounded-lg border border-black/30 bg-white px-3 text-sm" />
		<button type="button" onClick={upload} disabled={!file || !alt.trim()} className="min-h-11 rounded-lg border border-primary-700 px-4 text-sm font-bold text-primary-800 hover:bg-primary-100 disabled:opacity-50">{busy ? (en ? 'Uploading…' : 'Subiendo…') : (en ? 'Upload image' : 'Subir imagen')}</button>
		{message && <p role="status" className="text-sm text-black/80">{message}</p>}
	</fieldset>;
}
