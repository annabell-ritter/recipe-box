"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecipeFormState } from "@/app/recipes/actions";

// Mirrors the server-side limits in lib/recipes.ts. The browser limits are
// only a convenience; the server validates every submission again.
const TITLE_MAX_LENGTH = 200;
const TEXT_MAX_LENGTH = 10_000;

type RecipeFormProps = {
  action: (state: RecipeFormState, formData: FormData) => Promise<RecipeFormState>;
  submitLabel: string;
  initialValues?: { title: string; ingredients: string; instructions: string };
};

const textareaClass =
  "flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export function RecipeForm({ action, submitLabel, initialValues }: RecipeFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [ingredients, setIngredients] = useState(initialValues?.ingredients ?? "");
  const [instructions, setInstructions] = useState(initialValues?.instructions ?? "");

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.formError && (
        <p role="alert" className="text-sm text-red-500">
          {state.formError}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-sm text-red-500">
            {errors.title}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <textarea
          id="ingredients"
          name="ingredients"
          className={textareaClass}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          maxLength={TEXT_MAX_LENGTH}
          placeholder="One ingredient per line"
          aria-invalid={errors.ingredients ? true : undefined}
          aria-describedby={errors.ingredients ? "ingredients-error" : undefined}
        />
        {errors.ingredients && (
          <p id="ingredients-error" role="alert" className="text-sm text-red-500">
            {errors.ingredients}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <textarea
          id="instructions"
          name="instructions"
          className={textareaClass}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          maxLength={TEXT_MAX_LENGTH}
          aria-invalid={errors.instructions ? true : undefined}
          aria-describedby={errors.instructions ? "instructions-error" : undefined}
        />
        {errors.instructions && (
          <p id="instructions-error" role="alert" className="text-sm text-red-500">
            {errors.instructions}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link href="/recipes">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
