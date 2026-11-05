import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { Wordmark } from "@/components/wordmark";

/**
 * Page frame for every signed-in area (recipes, chat). It renders only after
 * the signed-in user is verified on the server. The proxy also redirects
 * signed-out visitors, but this check does not rely on it.
 */
export async function SignedInShell({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/recipes" aria-label="Recipe Box home">
              <Wordmark nameClassName="hidden sm:inline" />
            </Link>
            <NavLinks />
          </div>
          <LogoutButton />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-10">{children}</main>
    </div>
  );
}
