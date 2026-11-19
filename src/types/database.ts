export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          display_name: string;
          slug: string;
          approval_status: Database["public"]["Enums"]["business_approval_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          slug: string;
          approval_status?: Database["public"]["Enums"]["business_approval_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          slug?: string;
          approval_status?: Database["public"]["Enums"]["business_approval_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          brand_name: string | null;
          manufacturer_name: string | null;
          product_type: string | null;
          origin_country_code: string | null;
          ingredients: string | null;
          publication_status: Database["public"]["Enums"]["product_publication_status"];
          published_at: string | null;
          created_at: string;
          updated_at: string;
          search_vector: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          brand_name?: string | null;
          manufacturer_name?: string | null;
          product_type?: string | null;
          origin_country_code?: string | null;
          ingredients?: string | null;
          publication_status?: Database["public"]["Enums"]["product_publication_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          short_description?: string | null;
          description?: string | null;
          brand_name?: string | null;
          manufacturer_name?: string | null;
          product_type?: string | null;
          origin_country_code?: string | null;
          ingredients?: string | null;
          publication_status?: Database["public"]["Enums"]["product_publication_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt_text: string;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          alt_text: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          storage_path?: string;
          alt_text?: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      business_approval_status: "pending" | "approved" | "rejected" | "suspended";
      product_publication_status: "draft" | "published" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/**
 * Written to match supabase/migrations/20261119095711_catalogue_foundation.sql.
 * Replace with `supabase gen types typescript --local` after the migration has been applied
 * to a database. Docker was not available when this file was written, so it was not generated.
 */
