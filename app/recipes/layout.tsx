import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

// Every page under /recipes renders only after the signed-in user is verified
// on the server. The proxy also redirects signed-out visitors, but this check
// does not rely on it.
async function SignedInArea({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 text-sm">
          <span className="font-semibold">Recipe Box</span>
          <div className="flex items-center gap-4">
            {user.email && (
              <span className="text-muted-foreground">{user.email}</span>
            )}
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-3xl flex-1 p-5">{children}</main>
    </div>
  );
}

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <SignedInArea>{children}</SignedInArea>
    </Suspense>
  );
}
