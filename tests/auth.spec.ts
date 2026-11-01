import { test, expect } from '@playwright/test';

// Credentials come from .env.local (git-ignored). Never hardcode or log them.
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test('A: test user logs in, lands on /recipes, and logs out', async ({ page }) => {
  test.skip(
    !email || !password,
    'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local',
  );

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('heading', { name: 'Your recipes' })).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('B: signed-out visitor opening /recipes is sent to login', async ({ page }) => {
  await page.goto('/recipes');

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your recipes' })).toHaveCount(0);
});
