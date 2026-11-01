-- Recipes: each row belongs to one signed-in user.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  ingredients text not null default '',
  instructions text not null default '',
  created_at timestamptz not null default now()
);

-- Speeds up "my recipes" lookups and the RLS checks below.
create index recipes_user_id_idx on public.recipes (user_id);

alter table public.recipes enable row level security;

-- Owner-scoped policies for signed-in users only. No policy exists for anon,
-- so signed-out visitors get no rows and cannot write.

create policy "Users can view their own recipes"
  on public.recipes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own recipes"
  on public.recipes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own recipes"
  on public.recipes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own recipes"
  on public.recipes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
