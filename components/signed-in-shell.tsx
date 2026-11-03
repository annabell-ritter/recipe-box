import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

/**
 * Page frame for every signed-in area (recipes, chat). It renders only after
 * the signed-in user is verified on the server. The proxy also redirects
 * signed-out visitors, but this check does not rely on it.
 */
export async function SignedInShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 text-sm">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Recipe Box</span>
            <Link href="/recipes" className="hover:underline">
              Recipes
            </Link>
            <Link href="/chat" className="hover:underline">
              Chat
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user.email && (
              <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            )}
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-3xl flex-1 p-5">{children}</main>
    </div>
  );
}
