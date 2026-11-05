import { BackLink } from "@/components/back-link";
import { HeadingIcon } from "@/components/heading-icon";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipeAction } from "@/app/recipes/actions";

// Protected by app/recipes/layout.tsx (server-side user check) and the proxy.
export default function NewRecipePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <BackLink href="/recipes">Back to recipes</BackLink>
        <div className="group flex items-center gap-3">
          <HeadingIcon variant="edit" />
          <h1 className="text-2xl leading-tight sm:text-3xl">New recipe</h1>
        </div>
      </div>
      <RecipeForm action={createRecipeAction} submitLabel="Save recipe" />
    </div>
  );
}
