import { NotebookPen, Sparkles } from "lucide-react";

type HeadingIconProps = {
  variant: "recipes" | "chat" | "edit";
};

/**
 * Decorative icon shown next to a page title. It animates once when the page
 * loads (so touch screens, which have no hover, see it too) and again while
 * the surrounding heading row (marked with the Tailwind `group` class) is
 * hovered. It stays still for visitors who prefer reduced motion.
 *
 * The load animation sits on a wrapper and the hover animation on the icon
 * itself; on the same element, ending the hover would replay the load one.
 */
export function HeadingIcon({ variant }: HeadingIconProps) {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5"
    >
      {variant === "recipes" && <SteamingPot />}
      {variant === "chat" && (
        <span className="flex motion-safe:animate-twinkle-once">
          <Sparkles className="size-5 motion-safe:group-hover:animate-twinkle" />
        </span>
      )}
      {variant === "edit" && (
        <span className="flex motion-safe:animate-wiggle-once">
          <NotebookPen className="size-5 motion-safe:group-hover:animate-wiggle" />
        </span>
      )}
    </span>
  );
}

/** A cooking pot whose steam rises into place on load and loops on hover. */
function SteamingPot() {
  const steam = [
    { d: "M8 8c-.8-.8.8-1.7 0-2.5", delay: "0ms" },
    { d: "M12 8c-.8-.8.8-1.7 0-2.5", delay: "250ms" },
    { d: "M16 8c-.8-.8.8-1.7 0-2.5", delay: "500ms" },
  ];

  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="motion-safe:animate-steam-once">
        {steam.map(({ d, delay }) => (
          <path
            key={d}
            d={d}
            className="opacity-60 motion-safe:group-hover:animate-steam"
            style={{ animationDelay: delay }}
          />
        ))}
      </g>
      <path d="M3 11h18" />
      <path d="M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6" />
      <path d="M3 13H2M22 13h-1" />
    </svg>
  );
}
