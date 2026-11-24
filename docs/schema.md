# Costume Inventory — Supabase schema

Working model for the four core tables the app reads and writes. Column names are French to match domain language (`commandes`, etc.). After connecting the live Supabase project, regenerate types with the Supabase CLI if the remote schema differs.

```text
costumes 1──* costume_pieces *──1 pieces
costumes 1──* commandes
```

## `pieces`

Individual wardrobe items (garments, accessories, props tracked as inventory).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `nom` | `text` NOT NULL | Display name |
| `description` | `text` | Optional detail |
| `categorie` | `text` | e.g. haut, bas, accessoire |
| `taille` | `text` | Size label |
| `couleur` | `text` | Color |
| `etat` | `text` | Physical condition |
| `statut` | `text` / enum | `disponible` \| `reserve` \| `en_reparation` \| `retire` |
| `emplacement` | `text` | Storage location |
| `image_url` | `text` | Public or storage URL |
| `notes` | `text` | Free-form |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

## `costumes`

Named assemblies (looks / full outfits) composed of pieces.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `nom` | `text` NOT NULL | Costume name |
| `description` | `text` | Optional |
| `personnage` | `text` | Character / role |
| `production` | `text` | Show / film / event |
| `image_url` | `text` | Optional hero image |
| `notes` | `text` | Free-form |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

## `costume_pieces`

Join table: which pieces belong to which costume (supports drag-and-drop ordering via `@dnd-kit`).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `costume_id` | `uuid` FK → `costumes.id` | ON DELETE CASCADE |
| `piece_id` | `uuid` FK → `pieces.id` | ON DELETE RESTRICT |
| `quantite` | `int` | Default `1` |
| `ordre` | `int` | Sort order in the costume |
| `notes` | `text` | Optional |
| `created_at` | `timestamptz` | Default `now()` |

Unique recommendation: `(costume_id, piece_id)` when a piece should appear once per costume.

## `commandes`

Reservations / rental orders against costumes (and by extension their pieces).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `reference` | `text` | Human-readable order id |
| `client_nom` | `text` | Client / production contact name |
| `client_contact` | `text` | Email or phone |
| `date_debut` | `date` | Loan start |
| `date_fin` | `date` | Loan end |
| `statut` | `text` / enum | `brouillon` \| `confirmee` \| `en_cours` \| `retournee` \| `annulee` |
| `costume_id` | `uuid` FK → `costumes.id` | Optional until confirmed |
| `notes` | `text` | Free-form |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

## App access

- Client + server helpers: `src/lib/supabase/`
- Typed rows: `src/types/database.ts`
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`)

RLS policies should allow the anon (or authenticated) role to `select` / `insert` / `update` / `delete` on these four tables according to product rules.
