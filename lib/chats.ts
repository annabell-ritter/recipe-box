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

/** Matches the length check on chat_messages.content in the migration. */
const CONTENT_MAX_LENGTH = 20_000;

/**
 * Logs which action failed and the Postgres error code only; callers get a
 * generic error. The full error is never logged, because database errors can
 * quote the rejected row ("Failing row contains ..."), i.e. the user's chat text.
 */
function failed(action: string, error: unknown): never {
  const code =
    typeof error === "string"
      ? error // our own fixed reasons, e.g. "invalid conversation id"
      : typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
  console.error(`[chats] ${action} failed`, { code });
  throw new Error(`Could not ${action}. Please try again.`);
}

type SignedIn = Awaited<ReturnType<typeof requireSignedIn>>;

/** The newest `limit` messages of one of the user's conversations, oldest first. */
async function loadMessages(
  { supabase, userId }: SignedIn,
  conversationId: string,
  limit: number,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .order("id", { ascending: false })
    .limit(limit);

  if (error) failed("load your chat", error);

  return (data ?? [])
    .reverse()
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({ role: row.role as ChatMessage["role"], content: row.content }));
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
  const signedIn = await requireSignedIn();
  const { supabase, userId } = signedIn;

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

  return { conversationId: id, messages: await loadMessages(signedIn, id, LOAD_LIMIT) };
}

/**
 * The newest `limit` saved messages of a conversation, oldest first. This is
 * the history the AI sees, so it comes from the saved history, not the request.
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number,
): Promise<ChatMessage[]> {
  const signedIn = await requireSignedIn();
  if (!isConversationId(conversationId)) failed("load your chat", "invalid conversation id");
  return loadMessages(signedIn, conversationId, limit);
}

/**
 * When the signed-in user sent their questions since `since` (newest first,
 * at most `max`). Used for the per-user sending limit.
 */
export async function getQuestionTimesSince(since: Date, max: number): Promise<Date[]> {
  const { supabase, userId } = await requireSignedIn();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(max);

  if (error) failed("check your chat limit", error);
  return (data ?? []).map((row) => new Date(row.created_at));
}

/** Saves one question and the AI's reply, in that order, to a conversation. */
export async function saveExchange(
  conversationId: string,
  question: string,
  reply: string,
): Promise<void> {
  const { supabase } = await requireSignedIn();
  if (!isConversationId(conversationId)) failed("save your chat", "invalid conversation id");
  // Checked here so the database's length check (whose error would quote the
  // row) is not normally reached.
  for (const text of [question, reply]) {
    if (text.length === 0 || text.length > CONTENT_MAX_LENGTH) {
      failed("save your chat", "message length out of range");
    }
  }

  // user_id is deliberately not sent: the database default (auth.uid())
  // sets it, and the insert policy rejects any other value.
  const { error } = await supabase.from("chat_messages").insert([
    { conversation_id: conversationId, role: "user", content: question },
    { conversation_id: conversationId, role: "assistant", content: reply },
  ]);

  if (error) failed("save your chat", error);
}
