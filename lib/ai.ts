import "server-only";
import { fromChatMessages, OpenRouter } from "@openrouter/agent";
import { isTestSubstituteOn, testSubstituteReply } from "@/lib/ai-test-substitute";

/**
 * Central OpenRouter connection (server-only).
 *
 * All AI model calls go through this module. The `server-only` import makes
 * the build fail if a Client Component ever imports it, so OPENROUTER_API_KEY
 * can never end up in browser code. Never add a NEXT_PUBLIC_ prefix to it.
 */

/** The one place the model is chosen. Change this to switch models. */
export const AI_MODEL = "openai/gpt-5-mini";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// fromChatMessages is the SDK's own converter for {role, content} messages.
// Its return type does not match callModel's stricter `input` type in this
// SDK version, although callModel accepts it (verified against the API).
type ModelInput = Parameters<OpenRouter["callModel"]>[0]["input"];

let client: OpenRouter | null = null;

function getClient(): OpenRouter {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    client = new OpenRouter({ apiKey });
  }
  return client;
}

/** Send a prompt to the configured model and return the text reply. */
export async function generateText(
  input: string,
  options: { instructions?: string } = {},
): Promise<string> {
  const result = getClient().callModel({
    model: AI_MODEL,
    input,
    instructions: options.instructions,
  });
  return result.getText();
}

/**
 * Send the given messages (recent history plus the new question) to the
 * configured model and return its next reply. Passing the earlier messages
 * is what lets the model understand
 * follow-ups like "tell me more about that".
 */
export async function generateChatReply(
  messages: ChatMessage[],
  options: { instructions?: string; maxOutputTokens?: number } = {},
): Promise<string> {
  // Playwright tests on the local dev server get a fixed reply instead of a
  // live (paid) call. See lib/ai-test-substitute.ts for when this applies.
  if (await isTestSubstituteOn()) return testSubstituteReply(messages);

  const result = getClient().callModel({
    model: AI_MODEL,
    input: fromChatMessages(
      messages.map((m) => ({ role: m.role, content: m.content })),
    ) as ModelInput,
    instructions: options.instructions,
    maxOutputTokens: options.maxOutputTokens,
  });
  return result.getText();
}
