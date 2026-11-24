create table public.pokemon_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  pokemon_id integer not null check (pokemon_id > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, pokemon_id)
);

alter table public.pokemon_likes enable row level security;

revoke all on table public.pokemon_likes from public, anon, authenticated;
grant select, insert, delete on table public.pokemon_likes to authenticated;

create policy "Users can read their own Pokémon likes"
  on public.pokemon_likes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own Pokémon likes"
  on public.pokemon_likes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own Pokémon likes"
  on public.pokemon_likes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);