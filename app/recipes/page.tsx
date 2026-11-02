import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";
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
          Add your first recipe with the &quot;New recipe&quot; button.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Recipes">
      {recipes.map((recipe) => (
        <li
          key={recipe.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <h2 className="font-semibold break-words">{recipe.title}</h2>
            {recipe.ingredientsPreview && (
              <p className="mt-1 text-sm text-muted-foreground break-words">
                {recipe.ingredientsPreview}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/recipes/${recipe.id}/edit`}
                aria-label={`Edit ${recipe.title}`}
              >
                Edit
              </Link>
            </Button>
            <DeleteRecipeButton id={recipe.id} title={recipe.title} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Your recipes</h1>
        <Button asChild>
          <Link href="/recipes/new">New recipe</Link>
        </Button>
      </div>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading recipes…</p>}
      >
        <RecipeList />
      </Suspense>
    </div>
  );
}
