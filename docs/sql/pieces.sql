-- Run in the Supabase SQL editor so /pieces can save rows with the anon key.

create table if not exists public.pieces (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie text,
  stock_total integer default 0,
  photo_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pieces enable row level security;

-- Private Cursor app uses the anon/publishable key only.
drop policy if exists "pieces_select_anon" on public.pieces;
drop policy if exists "pieces_insert_anon" on public.pieces;
drop policy if exists "pieces_update_anon" on public.pieces;
drop policy if exists "pieces_delete_anon" on public.pieces;

create policy "pieces_select_anon" on public.pieces
  for select to anon using (true);
create policy "pieces_insert_anon" on public.pieces
  for insert to anon with check (true);
create policy "pieces_update_anon" on public.pieces
  for update to anon using (true) with check (true);
create policy "pieces_delete_anon" on public.pieces
  for delete to anon using (true);

-- Optional Storage bucket for piece photos (create in Dashboard if missing).
-- insert into storage.buckets (id, name, public) values ('photos-pieces', 'photos-pieces', true)
-- on conflict (id) do nothing;
