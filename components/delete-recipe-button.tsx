"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { deleteRecipeAction } from "@/app/recipes/actions";

function SubmitButton({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label={`Delete ${title}`}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}

/** Asks for confirmation, then deletes through the server action. */
export function DeleteRecipeButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteRecipeAction.bind(null, id)}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton title={title} />
    </form>
  );
}
