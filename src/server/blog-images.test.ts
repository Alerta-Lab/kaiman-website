import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from './db/schema';

const mock = vi.hoisted(() => ({ generate: vi.fn(), put: vi.fn(), del: vi.fn(), readFile: vi.fn(), transaction: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn() }));
vi.mock('openai', () => ({ default: class { images = { generate: mock.generate }; } }));
vi.mock('@vercel/blob', () => ({ put: mock.put, del: mock.del }));
vi.mock('node:fs/promises', () => ({ readFile: mock.readFile }));
vi.mock('./env', () => ({ getEnv: () => 'test-only' }));
vi.mock('./db/client', () => ({ requireDb: () => ({ transaction: mock.transaction }) }));
import { generateBlogImages, imagePrompts, uploadLocalBlogImages } from './blog-images';

const post = { id: 'id', translationGroupId: 'group', status: 'draft', title: 'Artículo', coverAlt: 'Alt', updatedAt: new Date('2026-01-01'), editorial: { approvedAt: '2026-01-01', coverCaption: '', coverPrompt: '', bodyAlt: 'Interior', bodyCaption: '', bodyPrompt: '', bodyImageUrl: null } } as unknown as Post;

describe('imágenes con Blob', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mock.generate.mockResolvedValue({ data: [{ b64_json: Buffer.from('image').toString('base64') }] });
		mock.put.mockImplementation(async (pathname: string, _body: unknown, options: { onUploadProgress?: (value: { percentage: number }) => void }) => { options.onUploadProgress?.({ percentage: 47 }); return { url: `https://example.com/${pathname}`, pathname }; });
		mock.del.mockResolvedValue(undefined);
		mock.readFile.mockResolvedValue(Buffer.from('local image'));
		mock.select.mockReturnValue({ from: () => ({ where: () => ({ for: async () => [post] }) }) });
		mock.insert.mockReturnValue({ values: async () => undefined });
		mock.update.mockReturnValue({ set: () => ({ where: async () => undefined }) });
		mock.transaction.mockImplementation(async (run) => run({ select: mock.select, insert: mock.insert, update: mock.update }));
	});
	it('sube dos imágenes y guarda sus referencias sin borrar imágenes anteriores', async () => {
		const events: { type: string; image?: string; percentage?: number }[] = [];
		const result = await generateBlogImages(post, '3:2', (event) => events.push(event));
		expect(mock.generate).toHaveBeenCalledTimes(2);
		expect(mock.generate.mock.calls[1][0].size).toBe('1536x1024');
		expect(mock.put).toHaveBeenCalledTimes(2);
		expect(mock.insert).toHaveBeenCalledOnce();
		expect(mock.del).not.toHaveBeenCalled();
		expect(result.coverUrl).toMatch(/^https:/);
		expect(events).toContainEqual({ type: 'uploading', image: 'cover', percentage: 47 });
		expect(events).toContainEqual({ type: 'uploading', image: 'body', percentage: 47 });
		expect(events.at(-1)).toEqual({ type: 'saving' });
	});
	it('elimina solo los archivos recién subidos cuando falla el guardado', async () => {
		mock.transaction.mockRejectedValue(new Error('fallo de base de datos'));
		await expect(generateBlogImages(post)).rejects.toThrow('fallo de base de datos');
		expect(mock.del).toHaveBeenCalledTimes(2);
	});
	it('no llama servicios si no se aceptó el borrador', async () => {
		await expect(generateBlogImages({ ...post, editorial: { ...post.editorial!, approvedAt: null } })).rejects.toThrow();
		expect(mock.generate).not.toHaveBeenCalled();
		expect(mock.put).not.toHaveBeenCalled();
	});
	it('sube las imágenes locales existentes sin llamar al generador', async () => {
		const local = { ...post, coverUrl: '/blog-generated/aaaaaaaa.webp', editorial: { ...post.editorial!, bodyImageUrl: '/blog-generated/bbbbbbbb.webp' } };
		mock.select.mockReturnValue({ from: () => ({ where: () => ({ for: async () => [local] }) }) });
		await uploadLocalBlogImages(local);
		expect(mock.readFile).toHaveBeenCalledTimes(2);
		expect(mock.put).toHaveBeenCalledTimes(2);
		expect(mock.generate).not.toHaveBeenCalled();
		expect(mock.del).not.toHaveBeenCalled();
	});
});

describe('prompt de imágenes', () => {
	it('interpreta el Word como concepto y aplica el estilo Kaiman sin texto', () => {
		const word = { ...post, excerpt: 'Membresías para med spas', coverAlt: 'Neon-lit interface in a dark, moody setting', editorial: { ...post.editorial!, coverPrompt: 'Night scene, dark neon salon' } } as Post;
		const [cover, body] = imagePrompts(word);
		expect(cover).toContain('Image brief: Night scene, dark neon salon');
		expect(cover).toContain('Article summary: Membresías para med spas');
		expect(cover).toMatch(/inspiration only.*Do not reproduce it literally/s);
		expect(cover.indexOf('KAIMAN HOUSE STYLE')).toBeGreaterThan(cover.indexOf('Night scene'));
		expect(cover).toMatch(/Never gloomy, murky or underexposed/);
		expect(cover).toMatch(/NO TEXT/);
		expect(cover).toMatch(/plain solid rounded bars/);
		expect(cover).toContain('Wide 16:9');
		expect(body).toContain('Tall 9:16');
		expect(body).toContain('same visual family');
		expect(body).not.toContain('Image brief:');
		expect(imagePrompts(word, '3:2')[1]).toContain('Horizontal 3:2');
	});
});
