-- Prefer docs/sql/schema.sql (full inventory schema).
-- This file only creates `pieces` with RLS and no anon policies.

create extension if not exists "pgcrypto";

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

-- No anon/authenticated policies: access is via the server service role only.
