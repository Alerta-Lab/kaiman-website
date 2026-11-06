export type ImagePart = 'cover' | 'body';
export type ImageProgressEvent =
	| { type: 'generating'; image: ImagePart }
	| { type: 'uploading'; image: ImagePart; percentage: number }
	| { type: 'uploaded'; image: ImagePart }
	| { type: 'saving' }
	| { type: 'complete'; coverUrl: string; bodyImageUrl: string }
	| { type: 'error'; message: string };
