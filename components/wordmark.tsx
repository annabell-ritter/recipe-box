import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The "Recipe Box" logo: a chef hat badge plus the name in the display font.
 * With `centerName`, only the name takes up layout space and the badge hangs
 * to its left, so a centered logo lines up with centered text below it.
 */
export function Wordmark({
  className,
  nameClassName,
  centerName = false,
}: {
  className?: string;
  nameClassName?: string;
  centerName?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary",
          centerName && "absolute right-full top-1/2 mr-2 -translate-y-1/2",
        )}
      >
        <ChefHat className="size-4" aria-hidden="true" />
      </span>
      <span className={cn("font-display text-xl leading-none", nameClassName)}>
        Recipe Box
      </span>
    </span>
  );
}
