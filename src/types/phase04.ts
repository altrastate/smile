import type { Database as GeneratedDatabase } from "@/types/database";

/**
 * Hand-written supplement for the Phase 04 migration
 * supabase/migrations/20261119113107_identity_and_applications.sql.
 * These tables are not in the generated Database type because that migration
 * has not been applied. Do not treat this file as generated output.
 * After the migration is applied, replace src/types/database.ts with:
 * supabase gen types typescript --linked --schema public > src/types/database.ts
 */

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Phase4Tables = {
  profiles: Table<{
    id: string;
    full_name: string;
    phone: string | null;
    country_code: string | null;
    terms_accepted_at: string;
    created_at: string;
    updated_at: string;
  }>;
  user_roles: Table<{
    user_id: string;
    role: "customer" | "business_owner" | "reviewer" | "admin";
    created_at: string;
  }>;
  business_applications: Table<{
    id: string;
    applicant_id: string;
    business_id: string;
    status:
      | "draft"
      | "submitted"
      | "under_review"
      | "information_requested"
      | "approved"
      | "rejected"
      | "withdrawn";
    business_kind: "producer" | "manufacturer" | "supplier" | "distributor" | "retailer" | "service_provider";
    description: string;
    country_code: string | null;
    district: string | null;
    city: string | null;
    address: string | null;
    website: string | null;
    business_email: string | null;
    business_phone: string | null;
    whatsapp_phone: string | null;
    registration_standing: "registered" | "not_registered" | "pending" | "not_required";
    registration_authority: string | null;
    registration_number: string | null;
    tax_identification: string | null;
    main_offerings: string | null;
    activities: string | null;
    regions_served: string | null;
    operations_summary: string | null;
    years_operating: number | null;
    applicant_position: string | null;
    authorised_declaration: boolean;
    accuracy_declaration: boolean;
    verification_consent: boolean;
    applicant_visible_message: string | null;
    submitted_at: string | null;
    decided_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  business_application_categories: Table<{
    application_id: string;
    category_id: string;
  }>;
  business_members: Table<{
    id: string;
    business_id: string;
    user_id: string;
    member_role: "owner" | "representative";
    created_at: string;
  }>;
  business_application_documents: Table<{
    id: string;
    application_id: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: string;
    created_at: string;
  }>;
  business_application_events: Table<{
    id: string;
    application_id: string;
    actor_id: string | null;
    event: string;
    from_status: string | null;
    to_status: string;
    applicant_message: string | null;
    created_at: string;
  }>;
  business_application_internal_notes: Table<{
    id: string;
    application_id: string;
    author_id: string;
    body: string;
    created_at: string;
  }>;
};

export type AppDatabase = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: GeneratedDatabase["public"]["Tables"] & Phase4Tables;
  };
};
