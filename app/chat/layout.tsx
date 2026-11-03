import { Suspense } from "react";
import { SignedInShell } from "@/components/signed-in-shell";

export default function ChatLayout({
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
