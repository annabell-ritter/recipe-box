import { Suspense } from "react";
import { redirect } from "next/navigation";
import { listRecipes, NotSignedInError } from "@/lib/recipes";

// Recipe data comes only from the central handler (lib/recipes.ts).
// All text is rendered as plain text through JSX, never as HTML.
async function RecipeList() {
  let recipes;
  try {
    recipes = await listRecipes();
  } catch (error) {
    if (error instanceof NotSignedInError) redirect("/auth/login");
    throw error;
  }

  if (recipes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">No recipes yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your recipes will appear here once you add your first one.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Recipes">
      {recipes.map((recipe) => (
        <li key={recipe.id} className="rounded-lg border p-4">
          <h2 className="font-semibold break-words">{recipe.title}</h2>
          {recipe.ingredientsPreview && (
            <p className="mt-1 text-sm text-muted-foreground break-words">
              {recipe.ingredientsPreview}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Your recipes</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading recipes…</p>}
      >
        <RecipeList />
      </Suspense>
    </div>
  );
}
