import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { authErrorMessage } from "@/lib/auth-errors";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;

  // Only the code is read from the URL; the text comes from our own list.
  return (
    <p className="text-sm text-muted-foreground">
      {authErrorMessage(params?.error)}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl font-normal">
            Sorry, something went wrong.
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
          <p className="mt-4 text-sm">
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
