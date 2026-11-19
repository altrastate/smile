import type { AppDatabase } from "@/types/phase04";

/**
 * Hand-written supplement for supabase/migrations/20261119131559_producer_storefront.sql.
 * The linked database has not received this migration or the Phase 04 migrations.
 * Do not treat this file as generated. After those migrations are applied, regenerate
 * src/types/database.ts and retire this supplement with src/types/phase04.ts.
 */

type GeneratedBusiness = AppDatabase["public"]["Tables"]["businesses"];

type StorefrontColumns = {
  description: string;
  country_code: string | null;
  city: string | null;
  district: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

type WorkspaceRow = {
  business_id: string;
  display_name: string;
  slug: string;
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  business_kind: "producer" | "manufacturer" | "supplier" | "distributor" | "retailer" | "service_provider";
  member_role: "owner" | "representative";
  description: string;
  country_code: string | null;
  city: string | null;
  district: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

type ProductTextArgs = {
  p_category_id: string;
  p_name: string;
  p_slug: string;
  p_short_description: string;
  p_description: string;
  p_brand_name: string;
  p_manufacturer_name: string;
  p_product_type: string;
  p_origin_country_code: string;
  p_ingredients: string;
};

export type Phase05Database = Omit<AppDatabase, "public"> & {
  public: Omit<AppDatabase["public"], "Tables" | "Functions"> & {
    Tables: Omit<AppDatabase["public"]["Tables"], "businesses"> & {
      businesses: {
        Row: GeneratedBusiness["Row"] & StorefrontColumns;
        Insert: GeneratedBusiness["Insert"] & Partial<StorefrontColumns>;
        Update: GeneratedBusiness["Update"] & Partial<StorefrontColumns>;
        Relationships: GeneratedBusiness["Relationships"];
      };
      product_image_orphans: {
        Row: {
          id: string;
          storage_path: string;
          product_id: string | null;
          reported_by: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_path: string;
          product_id?: string | null;
          reported_by: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          product_id?: string | null;
          reported_by?: string;
          reason?: string;
        };
        Relationships: [];
      };
    };
    Functions: AppDatabase["public"]["Functions"] & {
      producer_workspaces: { Args: Record<string, never>; Returns: WorkspaceRow[] };
      update_producer_storefront: {
        Args: {
          p_business_id: string;
          p_display_name: string;
          p_description: string;
          p_country_code: string;
          p_city: string;
          p_district: string;
          p_website: string;
          p_contact_email: string;
          p_contact_phone: string;
        };
        Returns: undefined;
      };
      create_producer_product: { Args: ProductTextArgs & { p_business_id: string }; Returns: string };
      update_producer_product: { Args: ProductTextArgs & { p_product_id: string }; Returns: undefined };
      set_producer_product_status: {
        Args: { p_product_id: string; p_status: "draft" | "published" | "archived" };
        Returns: undefined;
      };
      attach_product_image: {
        Args: { p_product_id: string; p_storage_path: string; p_alt_text: string };
        Returns: string;
      };
      remove_product_image: { Args: { p_image_id: string }; Returns: string };
      producer_may_store_image: { Args: { object_name: string }; Returns: boolean };
    };
  };
};
