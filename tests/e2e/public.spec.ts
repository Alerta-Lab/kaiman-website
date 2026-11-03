import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('landing home is usable', async ({ page }) => {
	await page.goto('/es/');
	await expect(page.getByRole('link', { name: /Blog/i })).toBeVisible();
});

test('blog home is usable and accessible', async ({ page }) => {
	await page.goto('/es/blogs');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Diseño, tecnología e IA');
	await expect(page.getByRole('link', { name: 'Iniciar sesión' }).first()).toHaveAttribute(
		'href',
		'https://app.kaimanstudio.ai/auth/login',
	);
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('search and article routes render in both locales', async ({ page }) => {
	await page.goto('/es/blogs/buscar?q=diseño');
	await expect(page.getByText(/resultado/)).toBeVisible();
	await page.goto('/es/blogs/disena-productos-digitales-con-intencion');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.goto('/en/blogs/disena-productos-digitales-con-intencion');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
