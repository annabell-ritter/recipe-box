import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOptionalUser } from "@/lib/auth";

// The proxy already redirects "/" before this renders. This is a second check
// on the server in case the proxy is ever skipped.
async function HomeRedirect(): Promise<null> {
  const user = await getOptionalUser();
  redirect(user ? "/recipes" : "/auth/login");
}

export default function Home() {
  return (
    <Suspense>
      <HomeRedirect />
    </Suspense>
  );
}
