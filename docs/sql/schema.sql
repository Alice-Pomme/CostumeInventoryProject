-- Costume Inventory — run once in the Supabase SQL editor.
--
-- Access model: RLS is enabled with NO grants for the `anon` role.
-- The private Cursor app reads/writes via the server-only service role key
-- (bypasses RLS). Never put the service role key in client/browser code.

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
drop policy if exists "pieces_select_authenticated" on public.pieces;
drop policy if exists "pieces_insert_authenticated" on public.pieces;
drop policy if exists "pieces_update_authenticated" on public.pieces;
drop policy if exists "pieces_delete_authenticated" on public.pieces;

-- No policies for anon or authenticated → denied by default.
-- Service role (server) bypasses RLS.

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
drop policy if exists "costumes_select_authenticated" on public.costumes;
drop policy if exists "costumes_insert_authenticated" on public.costumes;
drop policy if exists "costumes_update_authenticated" on public.costumes;
drop policy if exists "costumes_delete_authenticated" on public.costumes;

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
drop policy if exists "costume_pieces_select_authenticated" on public.costume_pieces;
drop policy if exists "costume_pieces_insert_authenticated" on public.costume_pieces;
drop policy if exists "costume_pieces_update_authenticated" on public.costume_pieces;
drop policy if exists "costume_pieces_delete_authenticated" on public.costume_pieces;

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
drop policy if exists "commandes_select_authenticated" on public.commandes;
drop policy if exists "commandes_insert_authenticated" on public.commandes;
drop policy if exists "commandes_update_authenticated" on public.commandes;
drop policy if exists "commandes_delete_authenticated" on public.commandes;

-- ── storage: public read for display URLs; writes via service role only ─
insert into storage.buckets (id, name, public)
values ('photos-pieces', 'photos-pieces', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "photos_pieces_public_read" on storage.objects;
drop policy if exists "photos_pieces_anon_insert" on storage.objects;
drop policy if exists "photos_pieces_anon_update" on storage.objects;
drop policy if exists "photos_pieces_anon_delete" on storage.objects;
drop policy if exists "photos_pieces_authenticated_insert" on storage.objects;
drop policy if exists "photos_pieces_authenticated_update" on storage.objects;

-- Anyone may read objects (needed for <img src> public URLs).
-- Uploads/updates go through the server service role (bypasses storage RLS).
create policy "photos_pieces_public_read" on storage.objects
  for select to public using (bucket_id = 'photos-pieces');
