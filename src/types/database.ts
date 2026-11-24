/**
 * Typed shape for the Costume Inventory Supabase schema.
 *
 * Column details mirror docs/schema.md. Adjust after inspecting the live project
 * (MCP/dashboard) if the remote schema differs.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PieceStatus = "disponible" | "reserve" | "en_reparation" | "retire";
export type CommandeStatus =
  | "brouillon"
  | "confirmee"
  | "en_cours"
  | "retournee"
  | "annulee";

export interface Database {
  public: {
    Tables: {
      pieces: {
        Row: {
          id: string;
          nom: string;
          description: string | null;
          categorie: string | null;
          taille: string | null;
          couleur: string | null;
          etat: string | null;
          statut: PieceStatus;
          emplacement: string | null;
          image_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          description?: string | null;
          categorie?: string | null;
          taille?: string | null;
          couleur?: string | null;
          etat?: string | null;
          statut?: PieceStatus;
          emplacement?: string | null;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          description?: string | null;
          categorie?: string | null;
          taille?: string | null;
          couleur?: string | null;
          etat?: string | null;
          statut?: PieceStatus;
          emplacement?: string | null;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      costumes: {
        Row: {
          id: string;
          nom: string;
          description: string | null;
          personnage: string | null;
          production: string | null;
          image_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          description?: string | null;
          personnage?: string | null;
          production?: string | null;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          description?: string | null;
          personnage?: string | null;
          production?: string | null;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      costume_pieces: {
        Row: {
          id: string;
          costume_id: string;
          piece_id: string;
          quantite: number;
          ordre: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          costume_id: string;
          piece_id: string;
          quantite?: number;
          ordre?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          costume_id?: string;
          piece_id?: string;
          quantite?: number;
          ordre?: number | null;
          notes?: string | null;
          created_at?: string;
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
          reference: string | null;
          client_nom: string | null;
          client_contact: string | null;
          date_debut: string | null;
          date_fin: string | null;
          statut: CommandeStatus;
          notes: string | null;
          costume_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference?: string | null;
          client_nom?: string | null;
          client_contact?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          statut?: CommandeStatus;
          notes?: string | null;
          costume_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string | null;
          client_nom?: string | null;
          client_contact?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          statut?: CommandeStatus;
          notes?: string | null;
          costume_id?: string | null;
          created_at?: string;
          updated_at?: string;
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
      piece_status: PieceStatus;
      commande_status: CommandeStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Piece = Database["public"]["Tables"]["pieces"]["Row"];
export type Costume = Database["public"]["Tables"]["costumes"]["Row"];
export type CostumePiece = Database["public"]["Tables"]["costume_pieces"]["Row"];
export type Commande = Database["public"]["Tables"]["commandes"]["Row"];
