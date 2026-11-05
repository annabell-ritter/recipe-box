import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChefHat, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeadingIcon } from "@/components/heading-icon";
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
      <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ChefHat className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-4 font-semibold">No recipes yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Start your collection with a favourite dish. Only you can see your recipes.
        </p>
        <Button asChild className="mt-6">
          <Link href="/recipes/new">
            <Plus aria-hidden="true" />
            Add your first recipe
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
      </p>
      <ul className="flex flex-col gap-3" aria-label="Recipes">
        {recipes.map((recipe) => (
          <li
            key={recipe.id}
            className="group flex items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
          >
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug break-words">{recipe.title}</h2>
              {recipe.ingredientsPreview && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground break-words">
                  {recipe.ingredientsPreview}
                </p>
              )}
            </div>
            <div className="-mr-2 -mt-1 flex shrink-0 gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href={`/recipes/${recipe.id}/edit`} aria-label={`Edit ${recipe.title}`}>
                  <Pencil aria-hidden="true" />
                </Link>
              </Button>
              <DeleteRecipeButton id={recipe.id} title={recipe.title} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecipeListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <span className="sr-only">Loading recipes…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="group flex min-w-0 items-center gap-3">
          <HeadingIcon variant="recipes" />
          <div>
            <h1 className="text-2xl leading-tight sm:text-3xl">Your recipes</h1>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              Everything you love to cook, in one place.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 px-3 sm:px-4">
          <Link href="/recipes/new">
            <Plus aria-hidden="true" />
            New recipe
          </Link>
        </Button>
      </div>
      <Suspense fallback={<RecipeListSkeleton />}>
        <RecipeList />
      </Suspense>
    </div>
  );
}
