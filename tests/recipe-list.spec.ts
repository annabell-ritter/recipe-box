import { test, expect } from '@playwright/test';

// Credentials come from .env.local (git-ignored). Never hardcode or log them.
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test('recipe list: test user sees the heading and the empty state', async ({ page }) => {
  test.skip(
    !email || !password,
    'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local',
  );

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('heading', { name: 'Your recipes', level: 1 })).toBeVisible();

  // The test user has no recipes yet, so the empty state is shown.
  await expect(page.getByText('No recipes yet')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Recipes' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});
