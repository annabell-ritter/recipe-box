"use server";

import { getOptionalUser } from "@/lib/auth";
import { generateChatReply, type ChatMessage } from "@/lib/ai";
import { isConversationId, saveExchange } from "@/lib/chats";

/**
 * Server action behind the chat page. It is a public endpoint, so it never
 * trusts the browser: it re-checks the signed-in user, validates the whole
 * conversation, and only then calls the model through lib/ai.ts. The API key
 * stays on the server; the browser only ever receives the reply text.
 */

// Limits keep a single request (and its cost) small. The browser mirrors
// MESSAGE_MAX_LENGTH for convenience, but these server checks are what count.
const MESSAGE_MAX_LENGTH = 4_000;
const MAX_MESSAGES = 40;
const MAX_OUTPUT_TOKENS = 2_000;

const INSTRUCTIONS =
  "You are a friendly cooking assistant inside a personal recipe app. " +
  "Help with recipes, ingredients, substitutions and cooking techniques. " +
  "Keep answers clear and reasonably short.";

export type SendChatResult =
  // saved is false when the reply arrived but could not be stored.
  | { ok: true; reply: string; saved: boolean }
  | { ok: false; error: string };

/** Accepts only well-formed user/assistant messages, in turn order. */
function parseConversation(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_MESSAGES) {
    return null;
  }

  const messages: ChatMessage[] = [];
  for (const item of input) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim();
    if (text.length === 0 || text.length > MESSAGE_MAX_LENGTH) return null;
    messages.push({ role, content: text });
  }

  // The conversation must end with the user's new message.
  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}

/**
 * Sends the whole conversation to the model (that is what gives the AI its
 * memory), then saves the new question and the reply to the conversation in
 * Supabase through lib/chats.ts.
 */
export async function sendChatMessage(
  conversationId: unknown,
  conversation: unknown,
): Promise<SendChatResult> {
  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Your session has ended. Please log in again." };
  }

  if (!isConversationId(conversationId)) {
    return { ok: false, error: "This conversation could not be found. Please start a new one." };
  }

  const messages = parseConversation(conversation);
  if (!messages) {
    return {
      ok: false,
      error: `Messages must be 1 to ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters, and a conversation can have at most ${MAX_MESSAGES} messages. Start a new conversation to keep chatting.`,
    };
  }

  let reply: string;
  try {
    reply = await generateChatReply(messages, {
      instructions: INSTRUCTIONS,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
  } catch (error) {
    // Log only the error type and status code, never request details.
    const status = (error as { statusCode?: number })?.statusCode;
    console.error("Chat model call failed", { name: (error as Error)?.name, status });
    return { ok: false, error: "The AI could not answer right now. Please try again." };
  }

  if (!reply.trim()) {
    return { ok: false, error: "The AI sent an empty reply. Please try again." };
  }

  // Saving happens only after a successful reply, so the history never holds
  // a question without its answer. A failed save still shows the reply.
  const question = messages[messages.length - 1].content;
  try {
    await saveExchange(conversationId, question, reply);
    return { ok: true, reply, saved: true };
  } catch {
    return { ok: true, reply, saved: false };
  }
}
