import "server-only";
import { cookies } from "next/headers";
import type { ChatMessage } from "@/lib/ai";

/**
 * Test-only stand-in for the OpenRouter call, so Playwright tests make no
 * live model calls and spend no credits.
 *
 * It is used only when BOTH are true:
 * - the app runs on the local dev server (`npm run dev`). In a production
 *   build (Vercel, `next start`) NODE_ENV is "production" and this always
 *   returns false;
 * - the request carries the cookie below, which only the Playwright tests set.
 *
 * Everything else (sign-in check, validation, saving to Supabase) still runs
 * normally; only the model call is replaced.
 */
export const TEST_SUBSTITUTE_COOKIE = "e2e-fake-ai";

export async function isTestSubstituteOn(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") return false;
  const store = await cookies();
  return store.get(TEST_SUBSTITUTE_COOKIE)?.value === "1";
}

/**
 * A fixed, predictable reply. It says how many messages the model would have
 * received, so a test can confirm the saved history (the AI's memory) was
 * loaded and passed along with the new question.
 */
export function testSubstituteReply(messages: ChatMessage[]): string {
  const questionNumber = messages.filter((m) => m.role === "user").length;
  const last = messages[messages.length - 1]?.content ?? "";
  const count = `${messages.length} message${messages.length === 1 ? "" : "s"}`;
  return `Test reply ${questionNumber} (received ${count}): ${last}`;
}
