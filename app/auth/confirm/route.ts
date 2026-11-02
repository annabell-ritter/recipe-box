import { type AuthErrorCode } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

const DEFAULT_NEXT = "/recipes";

// Only allow redirects to paths inside this app. The value is resolved against
// the request URL and must keep the same origin, so "//evil.com", "/\\evil.com",
// full URLs and tricks like "/<tab>/evil.com" all fall back to the default.
function safeNext(value: string | null, requestUrl: string): string {
  if (!value || !value.startsWith("/") || /[\s\\\u0000-\u001f\u007f]/.test(value)) {
    return DEFAULT_NEXT;
  }
  try {
    const base = new URL(requestUrl);
    const target = new URL(value, base);
    // Also reject paths that normalise to "//host" (e.g. "/a/..//evil.com").
    if (target.origin !== base.origin || target.pathname.startsWith("//")) {
      return DEFAULT_NEXT;
    }
    return `${target.pathname}${target.search}`;
  } catch {
    return DEFAULT_NEXT;
  }
}

function errorRedirect(code: AuthErrorCode): never {
  redirect(`/auth/error?error=${code}`);
}

// Handles the link in the sign-up confirmation email. Supabase's default email
// sends a `code`; a customised email template may send `token_hash` + `type`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"), request.url);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      errorRedirect("confirm_failed");
    }
    redirect(next);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      errorRedirect("link_invalid");
    }
    redirect(next);
  }

  errorRedirect("link_incomplete");
}
