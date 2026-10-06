import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('landing page leads into a new CV in the editor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ramah ATS');
  // Tailwind must be compiled: a missing PostCSS config once shipped raw "@tailwind" CSS.
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 15, 30)');
  await page.getByRole('link', { name: 'Mulai buat CV gratis' }).click();
  await expect(page).toHaveURL(/\/editor\?id=cv_/);
  await expect(page.getByRole('navigation', { name: 'Bagian CV' })).toBeVisible();
});

test('a filled-in CV exports as a PDF and shows on the dashboard', async ({ page }) => {
  await page.goto('/editor?new=1');
  await expect(page).toHaveURL(/\/editor\?id=cv_/);

  await page.getByRole('navigation', { name: 'Bagian CV' }).getByRole('button', { name: /Informasi pribadi/ }).click();
  await page.getByLabel(/Nama lengkap/).fill('Rina Lestari');
  await page.getByLabel(/^Email/).fill('rina@example.com');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/Rina.*\.pdf$/);
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');

  await page.getByRole('link', { name: /CV saya/ }).click();
  await expect(page.getByRole('heading', { name: 'CV saya' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rina Lestari' })).toBeVisible();
});
