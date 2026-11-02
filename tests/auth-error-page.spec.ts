import { test, expect } from '@playwright/test';

test('error page shows the message for a known error code', async ({ page }) => {
  await page.goto('/auth/error?error=link_incomplete');
  await expect(
    page.getByText('The confirmation link is missing or incomplete.'),
  ).toBeVisible();
});

test('error page never shows text taken from the URL', async ({ page }) => {
  const injected = 'Your account is locked. Call 0800 123 456';
  await page.goto(`/auth/error?error=${encodeURIComponent(injected)}`);

  await expect(
    page.getByText('Something went wrong. Please try logging in again.'),
  ).toBeVisible();
  await expect(page.getByText(injected)).toHaveCount(0);
});

test('confirm link without a code or token goes to the matching error message', async ({ page }) => {
  await page.goto('/auth/confirm');
  await expect(page).toHaveURL(/\/auth\/error\?error=link_incomplete$/);
  await expect(
    page.getByText('The confirmation link is missing or incomplete.'),
  ).toBeVisible();
});
