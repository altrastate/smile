// Generated from the local Supabase schema with `supabase gen types typescript --local --schema public`.
// p_years_operating is an integer argument and stores null when the applicant leaves it blank.
// The generator emits `number` for that argument.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_application_categories: {
        Row: {
          application_id: string
          category_id: string
        }
        Insert: {
          application_id: string
          category_id: string
        }
        Update: {
          application_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_application_categories_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_application_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_application_documents: {
        Row: {
          application_id: string
          created_at: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      business_application_events: {
        Row: {
          actor_id: string | null
          applicant_message: string | null
          application_id: string
          created_at: string
          event: Database["public"]["Enums"]["application_event"]
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          actor_id?: string | null
          applicant_message?: string | null
          application_id: string
          created_at?: string
          event: Database["public"]["Enums"]["application_event"]
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          actor_id?: string | null
          applicant_message?: string | null
          application_id?: string
          created_at?: string
          event?: Database["public"]["Enums"]["application_event"]
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "business_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      business_application_internal_notes: {
        Row: {
          application_id: string
          author_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_application_internal_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      business_applications: {
        Row: {
          accuracy_declaration: boolean
          activities: string | null
          address: string | null
          applicant_id: string
          applicant_position: string | null
          applicant_visible_message: string | null
          authorised_declaration: boolean
          business_email: string | null
          business_id: string
          business_kind: Database["public"]["Enums"]["business_kind"]
          business_phone: string | null
          city: string | null
          country_code: string | null
          created_at: string
          decided_at: string | null
          description: string
          district: string | null
          id: string
          main_offerings: string | null
          operations_summary: string | null
          regions_served: string | null
          registration_authority: string | null
          registration_number: string | null
          registration_standing: Database["public"]["Enums"]["registration_standing"]
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          tax_identification: string | null
          updated_at: string
          verification_consent: boolean
          website: string | null
          whatsapp_phone: string | null
          years_operating: number | null
        }
        Insert: {
          accuracy_declaration?: boolean
          activities?: string | null
          address?: string | null
          applicant_id: string
          applicant_position?: string | null
          applicant_visible_message?: string | null
          authorised_declaration?: boolean
          business_email?: string | null
          business_id: string
          business_kind: Database["public"]["Enums"]["business_kind"]
          business_phone?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string
          district?: string | null
          id?: string
          main_offerings?: string | null
          operations_summary?: string | null
          regions_served?: string | null
          registration_authority?: string | null
          registration_number?: string | null
          registration_standing?: Database["public"]["Enums"]["registration_standing"]
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          tax_identification?: string | null
          updated_at?: string
          verification_consent?: boolean
          website?: string | null
          whatsapp_phone?: string | null
          years_operating?: number | null
        }
        Update: {
          accuracy_declaration?: boolean
          activities?: string | null
          address?: string | null
          applicant_id?: string
          applicant_position?: string | null
          applicant_visible_message?: string | null
          authorised_declaration?: boolean
          business_email?: string | null
          business_id?: string
          business_kind?: Database["public"]["Enums"]["business_kind"]
          business_phone?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string
          district?: string | null
          id?: string
          main_offerings?: string | null
          operations_summary?: string | null
          regions_served?: string | null
          registration_authority?: string | null
          registration_number?: string | null
          registration_standing?: Database["public"]["Enums"]["registration_standing"]
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          tax_identification?: string | null
          updated_at?: string
          verification_consent?: boolean
          website?: string | null
          whatsapp_phone?: string | null
          years_operating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_document_orphans: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          reason: string
          reported_by: string
          storage_path: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          reason: string
          reported_by: string
          storage_path: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string
          storage_path?: string
        }
        Relationships: []
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          member_role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          member_role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["membership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          approval_status: Database["public"]["Enums"]["business_approval_status"]
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          description: string
          display_name: string
          district: string | null
          id: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["business_approval_status"]
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          display_name: string
          district?: string | null
          id?: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["business_approval_status"]
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          display_name?: string
          district?: string | null
          id?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_image_orphans: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          reason: string
          reported_by: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          reason: string
          reported_by: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          reason?: string
          reported_by?: string
          storage_path?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          product_id: string
          storage_path: string
        }
        Insert: {
          alt_text: string
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_name: string | null
          business_id: string
          category_id: string
          created_at: string
          description: string | null
          id: string
          ingredients: string | null
          manufacturer_name: string | null
          name: string
          origin_country_code: string | null
          product_type: string | null
          publication_status: Database["public"]["Enums"]["product_publication_status"]
          published_at: string | null
          search_vector: unknown
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          business_id: string
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string | null
          manufacturer_name?: string | null
          name: string
          origin_country_code?: string | null
          product_type?: string | null
          publication_status?: Database["public"]["Enums"]["product_publication_status"]
          published_at?: string | null
          search_vector?: unknown
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          business_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          ingredients?: string | null
          manufacturer_name?: string | null
          name?: string
          origin_country_code?: string | null
          product_type?: string | null
          publication_status?: Database["public"]["Enums"]["product_publication_status"]
          published_at?: string | null
          search_vector?: unknown
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          terms_accepted_at: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          terms_accepted_at: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          terms_accepted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_product_image: {
        Args: {
          p_alt_text: string
          p_product_id: string
          p_storage_path: string
        }
        Returns: string
      }
      create_producer_product: {
        Args: {
          p_brand_name: string
          p_business_id: string
          p_category_id: string
          p_description: string
          p_ingredients: string
          p_manufacturer_name: string
          p_name: string
          p_origin_country_code: string
          p_product_type: string
          p_short_description: string
          p_slug: string
        }
        Returns: string
      }
      decide_business_application: {
        Args: {
          p_application_id: string
          p_internal_note: string
          p_message: string
          p_status: Database["public"]["Enums"]["application_status"]
        }
        Returns: undefined
      }
      producer_may_store_image: {
        Args: { object_name: string }
        Returns: boolean
      }
      producer_workspaces: {
        Args: never
        Returns: {
          approval_status: Database["public"]["Enums"]["business_approval_status"]
          business_id: string
          business_kind: Database["public"]["Enums"]["business_kind"]
          city: string
          contact_email: string
          contact_phone: string
          country_code: string
          description: string
          display_name: string
          district: string
          member_role: Database["public"]["Enums"]["membership_role"]
          slug: string
          website: string
        }[]
      }
      remove_product_image: { Args: { p_image_id: string }; Returns: string }
      save_business_application: {
        Args: {
          p_accuracy: boolean
          p_activities: string
          p_address: string
          p_applicant_position: string
          p_application_id: string
          p_authorised: boolean
          p_business_email: string
          p_business_kind: Database["public"]["Enums"]["business_kind"]
          p_business_phone: string
          p_category_ids: string[]
          p_city: string
          p_consent: boolean
          p_country_code: string
          p_description: string
          p_display_name: string
          p_district: string
          p_main_offerings: string
          p_operations_summary: string
          p_regions_served: string
          p_registration_authority: string
          p_registration_number: string
          p_registration_standing: Database["public"]["Enums"]["registration_standing"]
          p_slug: string
          p_status: Database["public"]["Enums"]["application_status"]
          p_tax_identification: string
          p_website: string
          p_whatsapp_phone: string
          p_years_operating: number | null
        }
        Returns: undefined
      }
      set_producer_product_status: {
        Args: {
          p_product_id: string
          p_status: Database["public"]["Enums"]["product_publication_status"]
        }
        Returns: undefined
      }
      start_business_application: { Args: { p_slug: string }; Returns: string }
      update_producer_product: {
        Args: {
          p_brand_name: string
          p_category_id: string
          p_description: string
          p_ingredients: string
          p_manufacturer_name: string
          p_name: string
          p_origin_country_code: string
          p_product_id: string
          p_product_type: string
          p_short_description: string
          p_slug: string
        }
        Returns: undefined
      }
      update_producer_storefront: {
        Args: {
          p_business_id: string
          p_city: string
          p_contact_email: string
          p_contact_phone: string
          p_country_code: string
          p_description: string
          p_display_name: string
          p_district: string
          p_website: string
        }
        Returns: undefined
      }
      withdraw_business_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_event:
        | "submitted"
        | "under_review"
        | "information_requested"
        | "resubmitted"
        | "approved"
        | "rejected"
        | "withdrawn"
        | "created"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "information_requested"
        | "approved"
        | "rejected"
        | "withdrawn"
      business_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
      business_kind:
        | "producer"
        | "manufacturer"
        | "supplier"
        | "distributor"
        | "retailer"
        | "service_provider"
      membership_role: "owner" | "representative"
      platform_role: "customer" | "business_owner" | "reviewer" | "admin"
      product_publication_status: "draft" | "published" | "archived"
      registration_standing:
        | "registered"
        | "not_registered"
        | "pending"
        | "not_required"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_event: [
        "submitted",
        "under_review",
        "information_requested",
        "resubmitted",
        "approved",
        "rejected",
        "withdrawn",
        "created",
      ],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "information_requested",
        "approved",
        "rejected",
        "withdrawn",
      ],
      business_approval_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
      ],
      business_kind: [
        "producer",
        "manufacturer",
        "supplier",
        "distributor",
        "retailer",
        "service_provider",
      ],
      membership_role: ["owner", "representative"],
      platform_role: ["customer", "business_owner", "reviewer", "admin"],
      product_publication_status: ["draft", "published", "archived"],
      registration_standing: [
        "registered",
        "not_registered",
        "pending",
        "not_required",
      ],
    },
  },
} as const

