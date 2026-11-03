-- Signed-in users may only fill in conversation_id, role and content when
-- adding chat messages. id, user_id and created_at always come from the
-- database (identity, auth.uid() and now()), so a client cannot choose a
-- message's timestamp. The per-user sending limit counts by created_at.
-- Select and delete privileges, and all RLS policies, are unchanged.

revoke insert on table public.chat_messages from authenticated;
grant insert (conversation_id, role, content) on table public.chat_messages to authenticated;
