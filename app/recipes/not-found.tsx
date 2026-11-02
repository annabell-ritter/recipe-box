import Link from "next/link";

// Shown for any recipe that doesn't exist or isn't yours. The wording is the
// same in both cases, so it never reveals whether an id exists.
export default function RecipeNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Recipe not found</h1>
      <p className="text-muted-foreground">
        This recipe doesn&apos;t exist or is no longer available.
      </p>
      <Link href="/recipes" className="text-sm underline underline-offset-4">
        Back to your recipes
      </Link>
    </div>
  );
}
