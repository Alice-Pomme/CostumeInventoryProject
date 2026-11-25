# Costume Inventory — Schéma Supabase

Tables utilisées par l’interface (colonnes confirmées pour l’UI).

```text
costumes 1──* costume_pieces *──1 pieces
costumes 1──* commandes
```

## `pieces`

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `nom` | `text` | Nom de la pièce |
| `categorie` | `text` | Catégorie |
| `stock_total` | `int` | Quantité en stock |
| `photo_url` | `text` | URL publique (bucket `photos-pieces`) |
| `notes` | `text` | Notes libres |

## `costumes`

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `nom` | `text` | Nom du costume |
| `theme` | `text` | Thème |
| `photo_url` | `text` | Image optionnelle |
| `description` | `text` | Description |

## `costume_pieces`

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `costume_id` | `uuid` FK → `costumes.id` | |
| `piece_id` | `uuid` FK → `pieces.id` | |
| `quantite_par_costume` | `int` | Quantité de la pièce dans le costume |
| `ordre_habillage` | `int` | Ordre d’habillage (glisser-déposer) |

## `commandes`

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `client_nom` | `text` | Client / production |
| `costume_id` | `uuid` FK → `costumes.id` | Costume loué |
| `quantite_costumes` | `int` | Nombre d’exemplaires |
| `date_debut` | `date` | Début de location |
| `date_fin` | `date` | Fin de location |
| `statut` | `text` | `brouillon` \| `confirmee` \| `en_cours` \| `terminee` \| `annulee` |

Besoin pièce = `quantite_par_costume × quantite_costumes`, regroupé par `piece_id`. Les commandes aux dates qui se chevauchent consomment le `stock_total`.

## Stockage

Bucket Storage public : **`photos-pieces`** — photos des pièces ; l’URL publique est enregistrée dans `pieces.photo_url`.
