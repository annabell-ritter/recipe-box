// Error codes used in /auth/error?error=<code>. The link only ever carries a
// code; the text shown to the user comes from this list, so nobody can put
// their own message on the page by editing the URL.
export const AUTH_ERROR_MESSAGES = {
  confirm_failed:
    "This confirmation link could not sign you in. If your email is already confirmed, please log in.",
  link_invalid:
    "This confirmation link is invalid or has expired. Please log in, or sign up again.",
  link_incomplete: "The confirmation link is missing or incomplete.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

export const GENERIC_AUTH_ERROR_MESSAGE =
  "Something went wrong. Please try logging in again.";

export function authErrorMessage(code: string | string[] | undefined): string {
  if (typeof code === "string" && Object.hasOwn(AUTH_ERROR_MESSAGES, code)) {
    return AUTH_ERROR_MESSAGES[code as AuthErrorCode];
  }
  return GENERIC_AUTH_ERROR_MESSAGE;
}
