/**
 * Typed shape for the Costume Inventory Supabase schema.
 * Columns match the live project tables used by the app UI.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CommandeStatut =
  | "brouillon"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee";

export const COMMANDE_STATUTS: CommandeStatut[] = [
  "brouillon",
  "confirmee",
  "en_cours",
  "terminee",
  "annulee",
];

export const COMMANDE_STATUT_LABELS: Record<CommandeStatut, string> = {
  brouillon: "Brouillon",
  confirmee: "Confirmée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

/** Statuses that reserve stock against overlapping rentals. */
export const COMMANDE_STATUTS_RESERVANT: CommandeStatut[] = [
  "brouillon",
  "confirmee",
  "en_cours",
];

export interface Database {
  public: {
    Tables: {
      pieces: {
        Row: {
          id: string;
          nom: string;
          categorie: string | null;
          stock_total: number | null;
          photo_url: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nom: string;
          categorie?: string | null;
          stock_total?: number | null;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nom?: string;
          categorie?: string | null;
          stock_total?: number | null;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      costumes: {
        Row: {
          id: string;
          nom: string;
          theme: string | null;
          photo_url: string | null;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nom: string;
          theme?: string | null;
          photo_url?: string | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nom?: string;
          theme?: string | null;
          photo_url?: string | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      costume_pieces: {
        Row: {
          id: string;
          costume_id: string;
          piece_id: string;
          quantite_par_costume: number | null;
          ordre_habillage: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          costume_id: string;
          piece_id: string;
          quantite_par_costume?: number | null;
          ordre_habillage?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          costume_id?: string;
          piece_id?: string;
          quantite_par_costume?: number | null;
          ordre_habillage?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "costume_pieces_costume_id_fkey";
            columns: ["costume_id"];
            isOneToOne: false;
            referencedRelation: "costumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "costume_pieces_piece_id_fkey";
            columns: ["piece_id"];
            isOneToOne: false;
            referencedRelation: "pieces";
            referencedColumns: ["id"];
          },
        ];
      };
      commandes: {
        Row: {
          id: string;
          client_nom: string | null;
          costume_id: string | null;
          quantite_costumes: number | null;
          date_debut: string | null;
          date_fin: string | null;
          statut: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_nom?: string | null;
          costume_id?: string | null;
          quantite_costumes?: number | null;
          date_debut?: string | null;
          date_fin?: string | null;
          statut?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_nom?: string | null;
          costume_id?: string | null;
          quantite_costumes?: number | null;
          date_debut?: string | null;
          date_fin?: string | null;
          statut?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commandes_costume_id_fkey";
            columns: ["costume_id"];
            isOneToOne: false;
            referencedRelation: "costumes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      commande_statut: CommandeStatut;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Piece = Database["public"]["Tables"]["pieces"]["Row"];
export type Costume = Database["public"]["Tables"]["costumes"]["Row"];
export type CostumePiece = Database["public"]["Tables"]["costume_pieces"]["Row"];
export type Commande = Database["public"]["Tables"]["commandes"]["Row"];

export type CostumePieceWithPiece = CostumePiece & {
  pieces: Pick<Piece, "id" | "nom" | "categorie" | "photo_url" | "stock_total"> | null;
};

export type CommandeWithCostume = Commande & {
  costumes: Pick<Costume, "id" | "nom" | "theme"> | null;
};

export const PHOTOS_PIECES_BUCKET = "photos-pieces";

export type PieceBesoin = {
  piece_id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  quantite_par_costume: number;
  besoin_commande: number;
  reserve_autres: number;
  total_demande: number;
  disponible: number;
  manque: number;
  en_rupture: boolean;
};
