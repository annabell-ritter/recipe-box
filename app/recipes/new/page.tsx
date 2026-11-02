import { RecipeForm } from "@/components/recipe-form";
import { createRecipeAction } from "@/app/recipes/actions";

// Protected by app/recipes/layout.tsx (server-side user check) and the proxy.
export default function NewRecipePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">New recipe</h1>
      <RecipeForm action={createRecipeAction} submitLabel="Save recipe" />
    </div>
  );
}
