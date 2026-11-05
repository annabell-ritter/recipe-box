import { SearchX } from "lucide-react";
import { BackLink } from "@/components/back-link";

// Shown for any recipe that doesn't exist or isn't yours. The wording is the
// same in both cases, so it never reveals whether an id exists.
export default function RecipeNotFound() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl">Recipe not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This recipe doesn&apos;t exist or is no longer available.
      </p>
      <div className="mt-6">
        <BackLink href="/recipes">Back to your recipes</BackLink>
      </div>
    </div>
  );
}
