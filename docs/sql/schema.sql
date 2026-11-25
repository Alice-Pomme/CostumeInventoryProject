-- Costume Inventory — run once in the Supabase SQL editor.
-- Enables the app (anon key) to read/write all inventory tables.

create extension if not exists "pgcrypto";

-- ── pieces ──────────────────────────────────────────────────────────
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

drop policy if exists "pieces_select_anon" on public.pieces;
drop policy if exists "pieces_insert_anon" on public.pieces;
drop policy if exists "pieces_update_anon" on public.pieces;
drop policy if exists "pieces_delete_anon" on public.pieces;

create policy "pieces_select_anon" on public.pieces
  for select to anon, authenticated using (true);
create policy "pieces_insert_anon" on public.pieces
  for insert to anon, authenticated with check (true);
create policy "pieces_update_anon" on public.pieces
  for update to anon, authenticated using (true) with check (true);
create policy "pieces_delete_anon" on public.pieces
  for delete to anon, authenticated using (true);

-- ── costumes ────────────────────────────────────────────────────────
create table if not exists public.costumes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  theme text,
  photo_url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.costumes enable row level security;

drop policy if exists "costumes_select_anon" on public.costumes;
drop policy if exists "costumes_insert_anon" on public.costumes;
drop policy if exists "costumes_update_anon" on public.costumes;
drop policy if exists "costumes_delete_anon" on public.costumes;

create policy "costumes_select_anon" on public.costumes
  for select to anon, authenticated using (true);
create policy "costumes_insert_anon" on public.costumes
  for insert to anon, authenticated with check (true);
create policy "costumes_update_anon" on public.costumes
  for update to anon, authenticated using (true) with check (true);
create policy "costumes_delete_anon" on public.costumes
  for delete to anon, authenticated using (true);

-- ── costume_pieces ──────────────────────────────────────────────────
create table if not exists public.costume_pieces (
  id uuid primary key default gen_random_uuid(),
  costume_id uuid not null references public.costumes (id) on delete cascade,
  piece_id uuid not null references public.pieces (id) on delete cascade,
  quantite_par_costume integer not null default 1,
  ordre_habillage integer not null default 0,
  created_at timestamptz default now(),
  unique (costume_id, piece_id)
);

alter table public.costume_pieces enable row level security;

drop policy if exists "costume_pieces_select_anon" on public.costume_pieces;
drop policy if exists "costume_pieces_insert_anon" on public.costume_pieces;
drop policy if exists "costume_pieces_update_anon" on public.costume_pieces;
drop policy if exists "costume_pieces_delete_anon" on public.costume_pieces;

create policy "costume_pieces_select_anon" on public.costume_pieces
  for select to anon, authenticated using (true);
create policy "costume_pieces_insert_anon" on public.costume_pieces
  for insert to anon, authenticated with check (true);
create policy "costume_pieces_update_anon" on public.costume_pieces
  for update to anon, authenticated using (true) with check (true);
create policy "costume_pieces_delete_anon" on public.costume_pieces
  for delete to anon, authenticated using (true);

-- ── commandes ───────────────────────────────────────────────────────
create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  client_nom text,
  costume_id uuid references public.costumes (id) on delete set null,
  quantite_costumes integer not null default 1,
  date_debut date,
  date_fin date,
  statut text not null default 'brouillon',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.commandes enable row level security;

drop policy if exists "commandes_select_anon" on public.commandes;
drop policy if exists "commandes_insert_anon" on public.commandes;
drop policy if exists "commandes_update_anon" on public.commandes;
drop policy if exists "commandes_delete_anon" on public.commandes;

create policy "commandes_select_anon" on public.commandes
  for select to anon, authenticated using (true);
create policy "commandes_insert_anon" on public.commandes
  for insert to anon, authenticated with check (true);
create policy "commandes_update_anon" on public.commandes
  for update to anon, authenticated using (true) with check (true);
create policy "commandes_delete_anon" on public.commandes
  for delete to anon, authenticated using (true);

-- ── storage bucket for piece photos ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos-pieces', 'photos-pieces', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "photos_pieces_public_read" on storage.objects;
drop policy if exists "photos_pieces_anon_insert" on storage.objects;
drop policy if exists "photos_pieces_anon_update" on storage.objects;

create policy "photos_pieces_public_read" on storage.objects
  for select to public using (bucket_id = 'photos-pieces');
create policy "photos_pieces_anon_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'photos-pieces');
create policy "photos_pieces_anon_update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'photos-pieces')
  with check (bucket_id = 'photos-pieces');
