import { randomUUID } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { testEmail, testPassword } from './helpers';

/** Must match TEST_SUBSTITUTE_COOKIE in lib/ai-test-substitute.ts. */
const TEST_SUBSTITUTE_COOKIE = 'e2e-fake-ai';

/**
 * Turns on the server's fixed test replies for this browser, so no live
 * OpenRouter call is made. (The server honours it only on `npm run dev`.)
 */
export async function useFixedAiReplies(context: BrowserContext) {
  await context.addCookies([
    { name: TEST_SUBSTITUTE_COOKIE, value: '1', url: 'http://localhost:3000' },
  ]);
}

/** A conversation id no real chat uses; open it with /chat?c=<id>. */
export function newTestConversationId() {
  return randomUUID();
}

/**
 * Deletes the chat messages of exactly these test conversations, signed in
 * as the test user. RLS limits the delete to that user's own rows, and the
 * filter limits it to the given conversation ids, so nothing else is touched.
 * Returns how many messages were removed.
 */
export async function deleteTestConversations(conversationIds: string[]): Promise<number> {
  if (conversationIds.length === 0) return 0;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail!,
    password: testPassword!,
  });
  if (signInError) throw new Error(`Cleanup sign-in failed: ${signInError.message}`);

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .delete()
      .in('conversation_id', conversationIds)
      .select('id');
    if (error) throw new Error(`Cleanup delete failed: ${error.message}`);

    // Confirm nothing from these test conversations is left behind.
    const { count, error: countError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds);
    if (countError) throw new Error(`Cleanup check failed: ${countError.message}`);
    if (count !== 0) throw new Error(`Cleanup left ${count} test messages behind`);

    return data.length;
  } finally {
    await supabase.auth.signOut();
  }
}
