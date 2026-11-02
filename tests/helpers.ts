import { expect, type Page } from '@playwright/test';

// Credentials come from .env.local (git-ignored). Never hardcode or log them.
export const testEmail = process.env.E2E_TEST_EMAIL;
export const testPassword = process.env.E2E_TEST_PASSWORD;
export const hasTestUser = Boolean(testEmail && testPassword);
export const missingTestUserMessage =
  'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local';

export async function logIn(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(testEmail!);
  await page.getByLabel('Password').fill(testPassword!);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/recipes$/);
}

/** A title no other test run will use. */
export function uniqueTitle(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function recipeItem(page: Page, title: string) {
  return page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });
}

export async function createRecipeViaUi(
  page: Page,
  recipe: { title: string; ingredients: string; instructions: string },
) {
  await page.goto('/recipes');
  await page.getByRole('link', { name: 'New recipe' }).click();
  await expect(page).toHaveURL(/\/recipes\/new$/);
  await page.getByLabel('Title').fill(recipe.title);
  await page.getByLabel('Ingredients').fill(recipe.ingredients);
  await page.getByLabel('Instructions').fill(recipe.instructions);
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page).toHaveURL(/\/recipes$/);
  await expect(recipeItem(page, recipe.title)).toBeVisible();
}

/** Deletes every listed recipe with one of these titles (cleanup). */
export async function deleteRecipesViaUi(page: Page, titles: string[]) {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/recipes');
  // The list streams in after the page shell: wait until it (or the empty
  // state) is there before counting, or the cleanup would see nothing.
  await expect(
    page.getByRole('list', { name: 'Recipes' }).or(page.getByText('No recipes yet')),
  ).toBeVisible();
  for (const title of titles) {
    const item = recipeItem(page, title);
    while ((await item.count()) > 0) {
      await item.first().getByRole('button', { name: `Delete ${title}` }).click();
      await expect(item).toHaveCount(0);
    }
  }
}
