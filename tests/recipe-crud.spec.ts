import { test, expect } from '@playwright/test';
import {
  createRecipeViaUi,
  deleteRecipesViaUi,
  hasTestUser,
  logIn,
  missingTestUserMessage,
  recipeItem,
  uniqueTitle,
} from './helpers';

// Every test creates its own recipes and deletes them afterwards (even when
// the test fails), so the test account is empty again at the end.
let createdTitles: string[] = [];

test.beforeEach(async ({ page }) => {
  test.skip(!hasTestUser, missingTestUserMessage);
  createdTitles = [];
  await logIn(page);
});

test.afterEach(async ({ page }) => {
  if (hasTestUser && createdTitles.length > 0) {
    await deleteRecipesViaUi(page, createdTitles);
  }
});

test('create: add a recipe and see it in the list', async ({ page }) => {
  const title = uniqueTitle('create');
  createdTitles.push(title);

  await createRecipeViaUi(page, {
    title,
    ingredients: '200 g flour\n2 eggs\n300 ml milk',
    instructions: 'Mix everything.\nBake until golden.',
  });

  const item = recipeItem(page, title);
  await expect(item).toBeVisible();
  await expect(item.getByText('200 g flour, 2 eggs, 300 ml milk')).toBeVisible();
});

test('edit: change a recipe and see the change in the list', async ({ page }) => {
  const title = uniqueTitle('edit');
  const newTitle = `${title} (edited)`;
  createdTitles.push(title, newTitle);

  await createRecipeViaUi(page, {
    title,
    ingredients: '1 apple',
    instructions: 'Slice it.',
  });

  await recipeItem(page, title).getByRole('link', { name: `Edit ${title}` }).click();
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]+\/edit$/);
  await expect(page.getByLabel('Title')).toHaveValue(title);
  await expect(page.getByLabel('Ingredients')).toHaveValue('1 apple');

  await page.getByLabel('Title').fill(newTitle);
  await page.getByLabel('Ingredients').fill('2 apples');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  const item = recipeItem(page, newTitle);
  await expect(item).toBeVisible();
  await expect(item.getByText('2 apples')).toBeVisible();
  await expect(recipeItem(page, title)).toHaveCount(0);
});

test('delete: remove a recipe and see it disappear', async ({ page }) => {
  const title = uniqueTitle('delete');
  createdTitles.push(title);

  await createRecipeViaUi(page, {
    title,
    ingredients: '1 lemon',
    instructions: 'Squeeze it.',
  });

  page.once('dialog', (dialog) => dialog.accept());
  await recipeItem(page, title).getByRole('button', { name: `Delete ${title}` }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(recipeItem(page, title)).toHaveCount(0);
});
