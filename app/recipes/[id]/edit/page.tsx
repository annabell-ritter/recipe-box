import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { updateRecipeAction } from "@/app/recipes/actions";
import { getRecipe, NotSignedInError } from "@/lib/recipes";

// Protected by app/recipes/layout.tsx (server-side user check) and the proxy.
async function EditRecipe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let recipe;
  try {
    recipe = await getRecipe(id);
  } catch (error) {
    if (error instanceof NotSignedInError) redirect("/auth/login");
    throw error;
  }

  // Missing, malformed and other users' ids all look the same.
  if (!recipe) notFound();

  return (
    <RecipeForm
      action={updateRecipeAction.bind(null, recipe.id)}
      submitLabel="Save changes"
      initialValues={{
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
      }}
    />
  );
}

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Edit recipe</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading recipe…</p>}>
        <EditRecipe params={params} />
      </Suspense>
    </div>
  );
}
