import { Wordmark } from "@/components/wordmark";

/** Centered frame for the public auth pages: logo, tagline, then the card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Wordmark nameClassName="text-2xl" centerName />
          <p className="text-sm text-muted-foreground">Your recipes, kept private.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
