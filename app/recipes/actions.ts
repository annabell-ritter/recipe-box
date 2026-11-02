"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecipe,
  deleteRecipe,
  NotSignedInError,
  updateRecipe,
  type RecipeFieldErrors,
  type RecipeInput,
  type SaveRecipeResult,
} from "@/lib/recipes";

/**
 * Server actions for the recipe pages. They are public endpoints, so they
 * never trust the browser: every call goes through lib/recipes.ts, which
 * verifies the signed-in user and validates the input on the server.
 * No action reads a user_id from the form or the URL.
 */

export type RecipeFormState = {
  fieldErrors?: RecipeFieldErrors;
  formError?: string;
};

/** Reads only the three recipe fields; anything else in the form is ignored. */
function readRecipeFields(formData: FormData): RecipeInput {
  return {
    title: formData.get("title"),
    ingredients: formData.get("ingredients"),
    instructions: formData.get("instructions"),
  };
}

async function runOrRedirectToLogin<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof NotSignedInError) redirect("/auth/login");
    throw error;
  }
}

function toFormState(result: Exclude<SaveRecipeResult, { ok: true }>): RecipeFormState {
  if ("fieldErrors" in result) return { fieldErrors: result.fieldErrors };
  return { formError: "This recipe could not be found." };
}

export async function createRecipeAction(
  _previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const result = await runOrRedirectToLogin(() =>
    createRecipe(readRecipeFields(formData)),
  );
  if (!result.ok) return toFormState(result);

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipeAction(
  id: string,
  _previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const result = await runOrRedirectToLogin(() =>
    updateRecipe(id, readRecipeFields(formData)),
  );
  if (!result.ok) return toFormState(result);

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function deleteRecipeAction(id: string): Promise<void> {
  // A missing or someone else's recipe is treated the same as a deleted one,
  // so the response never reveals whether an id exists.
  await runOrRedirectToLogin(() => deleteRecipe(id));

  revalidatePath("/recipes");
  redirect("/recipes");
}
