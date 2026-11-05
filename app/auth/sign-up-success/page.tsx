import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl font-normal">
            Thank you for signing up!
          </CardTitle>
          <CardDescription>Check your email to confirm</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You&apos;ve successfully signed up. Please check your email to
            confirm your account before signing in.
          </p>
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
