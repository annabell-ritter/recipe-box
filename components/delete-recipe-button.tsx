"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRecipeAction } from "@/app/recipes/actions";

function SubmitButton({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`Delete ${title}`}
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
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
