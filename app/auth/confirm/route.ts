import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// Only allow redirects to paths inside this app (no "//evil.com" or full URLs).
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/recipes";
  }
  return value;
}

function errorRedirect(message: string): never {
  redirect(`/auth/error?error=${encodeURIComponent(message)}`);
}

// Handles the link in the sign-up confirmation email. Supabase's default email
// sends a `code`; a customised email template may send `token_hash` + `type`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      errorRedirect(
        "This confirmation link could not sign you in. If your email is already confirmed, please log in.",
      );
    }
    redirect(next);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      errorRedirect(error.message);
    }
    redirect(next);
  }

  errorRedirect("The confirmation link is missing or incomplete.");
}
