import "server-only";
import { createClient } from "@/lib/supabase/server";
import { NotSignedInError } from "@/lib/recipes";
import type { ChatMessage } from "@/lib/ai";

/**
 * Central data handler for chat history.
 *
 * This is the ONLY module that talks to the `chat_messages` table (a lint
 * rule enforces it). Like lib/recipes.ts, every function:
 * - verifies the signed-in user on the server with getUser() and throws
 *   NotSignedInError if nobody is signed in;
 * - never accepts a user_id from the caller (the database sets it from the
 *   signed-in user, and RLS limits every query to their own rows);
 * - also filters by the verified user's id, as a second layer on top of RLS;
 * - returns only role and content, never raw database rows.
 */

/** Upper bound on how many messages are loaded back into the page. */
const LOAD_LIMIT = 200;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Conversation = {
  conversationId: string;
  messages: ChatMessage[];
};

export function isConversationId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

async function requireSignedIn() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new NotSignedInError();
  }

  return { supabase, userId: data.user.id };
}

/** Logs the real database error on the server; callers get a generic one. */
function failed(action: string, error: unknown): never {
  console.error(`[chats] ${action} failed:`, error);
  throw new Error(`Could not ${action}. Please try again.`);
}

/**
 * Loads a conversation of the signed-in user.
 *
 * - With a valid id: that conversation's messages (empty if it has none yet,
 *   e.g. right after "New conversation").
 * - Without one: the user's most recent conversation, or a brand-new empty
 *   one if they have never chatted.
 */
export async function getConversation(conversationId?: string): Promise<Conversation> {
  const { supabase, userId } = await requireSignedIn();

  let id = isConversationId(conversationId) ? conversationId : null;

  if (!id) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("conversation_id")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) failed("load your chat", error);
    if (!data) return { conversationId: crypto.randomUUID(), messages: [] };
    id = data.conversation_id;
  }

  // Newest LOAD_LIMIT messages, then back into chronological order.
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("conversation_id", id)
    .order("id", { ascending: false })
    .limit(LOAD_LIMIT);

  if (error) failed("load your chat", error);

  const messages: ChatMessage[] = (data ?? [])
    .reverse()
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({ role: row.role as ChatMessage["role"], content: row.content }));

  return { conversationId: id, messages };
}

/** Saves one question and the AI's reply, in that order, to a conversation. */
export async function saveExchange(
  conversationId: string,
  question: string,
  reply: string,
): Promise<void> {
  const { supabase } = await requireSignedIn();
  if (!isConversationId(conversationId)) failed("save your chat", "invalid conversation id");

  // user_id is deliberately not sent: the database default (auth.uid())
  // sets it, and the insert policy rejects any other value.
  const { error } = await supabase.from("chat_messages").insert([
    { conversation_id: conversationId, role: "user", content: question },
    { conversation_id: conversationId, role: "assistant", content: reply },
  ]);

  if (error) failed("save your chat", error);
}
