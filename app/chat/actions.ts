"use server";

import { getOptionalUser } from "@/lib/auth";
import { generateChatReply, type ChatMessage } from "@/lib/ai";
import {
  getQuestionTimesSince,
  getRecentMessages,
  isConversationId,
  saveExchange,
} from "@/lib/chats";

/**
 * Server action behind the chat page. It is a public endpoint, so it never
 * trusts the browser: it re-checks the signed-in user and accepts only the
 * new question. The earlier messages the AI sees are loaded from the
 * database, so the browser cannot invent "assistant" turns. The API key stays
 * on the server; the browser only ever receives the reply text.
 */

// Limits keep a single request (and its cost) small. The browser mirrors
// MESSAGE_MAX_LENGTH for convenience, but these server checks are what count.
const MESSAGE_MAX_LENGTH = 4_000;
const MAX_OUTPUT_TOKENS = 2_000;
// How many saved messages (questions and replies) the AI sees as history.
const HISTORY_LIMIT = 20;

// Per-user sending limits, counted from the user's saved questions. This
// stops heavy use from one account; the OpenRouter spending limit on the API
// key is the hard cap on cost.
const SHORT_WINDOW_MS = 10 * 60 * 1000;
const SHORT_WINDOW_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = 200;

const INSTRUCTIONS =
  "You are a friendly cooking assistant inside a personal recipe app. " +
  "Help with recipes, ingredients, substitutions and cooking techniques. " +
  "Keep answers clear and reasonably short.";

export type SendChatResult =
  // saved is false when the reply arrived but could not be stored.
  | { ok: true; reply: string; saved: boolean }
  | { ok: false; error: string };

/** Accepts only a non-empty string within the length limit. */
function parseQuestion(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const text = input.trim();
  if (text.length === 0 || text.length > MESSAGE_MAX_LENGTH) return null;
  return text;
}

/** Returns a message for the user if they are over a sending limit. */
async function checkSendingLimit(): Promise<string | null> {
  const now = Date.now();
  const times = await getQuestionTimesSince(new Date(now - DAY_MS), DAILY_LIMIT);

  if (times.length >= DAILY_LIMIT) {
    return "You have reached today's chat limit. Please try again tomorrow.";
  }
  const recent = times.filter((t) => t.getTime() > now - SHORT_WINDOW_MS).length;
  if (recent >= SHORT_WINDOW_LIMIT) {
    return "You have sent a lot of messages in the last few minutes. Please wait a bit and try again.";
  }
  return null;
}

/**
 * Sends the saved conversation plus the new question to the model (that is
 * what gives the AI its memory), then saves the question and the reply to the
 * conversation in Supabase through lib/chats.ts.
 */
export async function sendChatMessage(
  conversationId: unknown,
  question: unknown,
): Promise<SendChatResult> {
  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Your session has ended. Please log in again." };
  }

  if (!isConversationId(conversationId)) {
    return { ok: false, error: "This conversation could not be found. Please start a new one." };
  }

  const text = parseQuestion(question);
  if (!text) {
    return {
      ok: false,
      error: `Messages must be 1 to ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters.`,
    };
  }

  let messages: ChatMessage[];
  try {
    const [limitMessage, history] = await Promise.all([
      checkSendingLimit(),
      getRecentMessages(conversationId, HISTORY_LIMIT),
    ]);
    if (limitMessage) return { ok: false, error: limitMessage };
    messages = [...history, { role: "user", content: text }];
  } catch {
    // lib/chats.ts has already logged the (safe) error details.
    return { ok: false, error: "Your chat could not be loaded. Please try again." };
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
  try {
    await saveExchange(conversationId, text, reply);
    return { ok: true, reply, saved: true };
  } catch {
    return { ok: true, reply, saved: false };
  }
}
