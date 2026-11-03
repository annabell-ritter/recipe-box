import { Suspense } from "react";
import { SignedInShell } from "@/components/signed-in-shell";

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <SignedInShell>{children}</SignedInShell>
    </Suspense>
  );
}
