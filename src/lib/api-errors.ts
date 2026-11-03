import { ZodError, type ZodIssue } from 'zod';

const fieldLabels: Record<string, string> = {
	title: 'Título',
	slug: 'Slug',
	excerpt: 'Descripción',
	markdown: 'Contenido Markdown',
	status: 'Estado',
	locale: 'Idioma',
	seoTitle: 'Título SEO',
	seoDescription: 'Descripción SEO',
	coverUrl: 'URL de portada',
	coverAlt: 'Texto alternativo',
	tags: 'Etiquetas',
};

function labelFor(path: PropertyKey[]) {
	const key = String(path[0] ?? '');
	return fieldLabels[key] ?? (key || 'Campo');
}

function friendlyIssue(issue: ZodIssue): string {
	const label = labelFor(issue.path);
	switch (issue.code) {
		case 'too_small':
			if (issue.origin === 'string' || issue.origin === 'array') {
				return `${label}: escribe al menos ${issue.minimum} caracteres.`;
			}
			return `${label}: el valor es demasiado corto.`;
		case 'too_big':
			if (issue.origin === 'string' || issue.origin === 'array') {
				return `${label}: usa como máximo ${issue.maximum} caracteres.`;
			}
			return `${label}: el valor es demasiado largo.`;
		case 'invalid_format':
			return `${label}: el formato no es válido.`;
		case 'invalid_value':
			return `${label}: el valor no está permitido.`;
		default:
			return `${label}: revisa este campo.`;
	}
}

export type ApiErrorBody = {
	error: string;
	detail?: string;
};

export function toApiError(error: unknown): ApiErrorBody {
	if (error instanceof ZodError) {
		const messages = error.issues.map(friendlyIssue);
		return {
			error: messages.join(' ') || 'Revisa los campos del formulario.',
			detail: JSON.stringify(error.issues, null, 2),
		};
	}

	if (error instanceof Error) {
		return {
			error: error.message || 'Algo salió mal.',
			detail: error.stack,
		};
	}

	return { error: 'Algo salió mal.' };
}
