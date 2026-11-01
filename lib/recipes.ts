import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

/**
 * Central data handler for recipes.
 *
 * This is the ONLY module that talks to the `recipes` table. Pages and
 * components must call these functions instead of querying Supabase.
 *
 * Every function:
 * - verifies the signed-in user on the server with getUser() and throws
 *   NotSignedInError if nobody is signed in;
 * - never accepts a user_id from the caller (the database sets user_id from
 *   the signed-in user on insert, and RLS limits every query to their rows);
 * - also filters by the verified user's id, as a second layer on top of RLS;
 * - returns only the fields the app needs, never raw database rows.
 */

export const TITLE_MAX_LENGTH = 200;
export const TEXT_MAX_LENGTH = 10_000;
export const PREVIEW_MAX_LENGTH = 100;

const SUMMARY_COLUMNS = "id, title, ingredients, created_at";
const DETAIL_COLUMNS = "id, title, ingredients, instructions, created_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RecipeSummary = {
  id: string;
  title: string;
  /** Ingredients on one line, cut to about 100 characters with "...". */
  ingredientsPreview: string;
  createdAt: string;
};

export type Recipe = {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  createdAt: string;
};

/** What a form sends. Values are checked, never trusted. */
export type RecipeInput = {
  title?: unknown;
  ingredients?: unknown;
  instructions?: unknown;
};

export type RecipeFieldErrors = Partial<
  Record<"title" | "ingredients" | "instructions", string>
>;

export type SaveRecipeResult =
  | { ok: true; recipe: Recipe }
  | { ok: false; fieldErrors: RecipeFieldErrors }
  | { ok: false; notFound: true };

export class NotSignedInError extends Error {
  constructor() {
    super("You must be signed in to do this.");
    this.name = "NotSignedInError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

type DetailRow = Pick<
  Tables<"recipes">,
  "id" | "title" | "ingredients" | "instructions" | "created_at"
>;

type SummaryRow = Pick<DetailRow, "id" | "title" | "ingredients" | "created_at">;

/** Server-side client plus the verified signed-in user's id. */
async function requireSignedIn() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new NotSignedInError();
  }

  return { supabase, userId: data.user.id };
}

/** Joins the ingredient lines with ", " and shortens to PREVIEW_MAX_LENGTH. */
function previewOf(text: string): string {
  const oneLine = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");
  if (oneLine.length <= PREVIEW_MAX_LENGTH) return oneLine;
  return `${oneLine.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}...`;
}

function toSummary(row: SummaryRow): RecipeSummary {
  return {
    id: row.id,
    title: row.title,
    ingredientsPreview: previewOf(row.ingredients),
    createdAt: row.created_at,
  };
}

function toRecipe(row: DetailRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    ingredients: row.ingredients,
    instructions: row.instructions,
    createdAt: row.created_at,
  };
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && UUID_PATTERN.test(id);
}

/** Normalises line endings so length limits match what the user typed. */
function asText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n") : "";
}

function validateInput(
  input: RecipeInput,
):
  | { ok: true; values: { title: string; ingredients: string; instructions: string } }
  | { ok: false; fieldErrors: RecipeFieldErrors } {
  const title = asText(input.title).trim();
  const ingredients = asText(input.ingredients).trim();
  const instructions = asText(input.instructions).trim();

  const fieldErrors: RecipeFieldErrors = {};

  if (title.length === 0) {
    fieldErrors.title = "Please enter a title.";
  } else if (title.length > TITLE_MAX_LENGTH) {
    fieldErrors.title = `The title can be at most ${TITLE_MAX_LENGTH} characters.`;
  }
  if (ingredients.length > TEXT_MAX_LENGTH) {
    fieldErrors.ingredients = `Ingredients can be at most ${TEXT_MAX_LENGTH} characters.`;
  }
  if (instructions.length > TEXT_MAX_LENGTH) {
    fieldErrors.instructions = `Instructions can be at most ${TEXT_MAX_LENGTH} characters.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true, values: { title, ingredients, instructions } };
}

/** Logs the real database error on the server; callers get a generic one. */
function failed(action: string, error: unknown): never {
  console.error(`[recipes] ${action} failed:`, error);
  throw new Error(`Could not ${action}. Please try again.`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** The signed-in user's recipes, newest first. */
export async function listRecipes(): Promise<RecipeSummary[]> {
  const { supabase, userId } = await requireSignedIn();

  const { data, error } = await supabase
    .from("recipes")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) failed("load your recipes", error);
  return (data ?? []).map(toSummary);
}

/** One of the signed-in user's recipes, or null if it doesn't exist or isn't theirs. */
export async function getRecipe(id: string): Promise<Recipe | null> {
  const { supabase, userId } = await requireSignedIn();
  if (!isValidId(id)) return null;

  const { data, error } = await supabase
    .from("recipes")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) failed("load this recipe", error);
  return data ? toRecipe(data) : null;
}

/** Creates a recipe owned by the signed-in user. */
export async function createRecipe(input: RecipeInput): Promise<SaveRecipeResult> {
  const { supabase } = await requireSignedIn();

  const validated = validateInput(input);
  if (!validated.ok) return validated;

  // user_id is deliberately not sent: the database default (auth.uid())
  // sets it, and the insert policy rejects any other value.
  const { data, error } = await supabase
    .from("recipes")
    .insert(validated.values)
    .select(DETAIL_COLUMNS)
    .single();

  if (error || !data) failed("save your recipe", error);
  return { ok: true, recipe: toRecipe(data) };
}

/** Updates one of the signed-in user's recipes. */
export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<SaveRecipeResult> {
  const { supabase, userId } = await requireSignedIn();
  if (!isValidId(id)) return { ok: false, notFound: true };

  const validated = validateInput(input);
  if (!validated.ok) return validated;

  const { data, error } = await supabase
    .from("recipes")
    .update(validated.values)
    .eq("id", id)
    .eq("user_id", userId)
    .select(DETAIL_COLUMNS)
    .maybeSingle();

  if (error) failed("update your recipe", error);
  if (!data) return { ok: false, notFound: true };
  return { ok: true, recipe: toRecipe(data) };
}

/** Deletes one of the signed-in user's recipes. Returns false if it wasn't found. */
export async function deleteRecipe(id: string): Promise<boolean> {
  const { supabase, userId } = await requireSignedIn();
  if (!isValidId(id)) return false;

  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) failed("delete your recipe", error);
  return (data ?? []).length > 0;
}
