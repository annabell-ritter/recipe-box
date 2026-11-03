-- Chat messages: each row is one message in one of a user's conversations.
-- A conversation is just the set of rows sharing a conversation_id; there is
-- no separate conversations table.

create table public.chat_messages (
  -- An identity column keeps messages in the exact order they were saved,
  -- even when a question and its reply are inserted together.
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now()
);

-- Loading one conversation in order, and finding the user's latest one.
create index chat_messages_user_conversation_idx
  on public.chat_messages (user_id, conversation_id, id);
create index chat_messages_user_latest_idx
  on public.chat_messages (user_id, id desc);

alter table public.chat_messages enable row level security;

-- Owner-scoped policies for signed-in users only. No policy exists for anon,
-- so signed-out visitors get no rows and cannot write. Messages are never
-- edited, so there is no update policy.

create policy "Users can view their own chat messages"
  on public.chat_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own chat messages"
  on public.chat_messages
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own chat messages"
  on public.chat_messages
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Table privileges: signed-out visitors (anon) get nothing; signed-in users
-- get exactly select, insert and delete, still limited to their own rows by
-- the policies above.
revoke all on table public.chat_messages from anon, authenticated;
grant select, insert, delete on table public.chat_messages to authenticated;
