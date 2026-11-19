import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import { listCategories } from "@/features/catalogue/queries";
import {
  approvalStatuses,
  businessKinds,
  resolveWorkspaceSelection,
  workspaceState,
  type ApprovalStatus,
  type BusinessKind,
  type PublicationStatus,
  type WorkspaceState,
} from "@/features/dashboard/eligibility";
import { escapeIlike } from "@/features/dashboard/validation";
import { isSafeProductImagePath } from "@/features/dashboard/images";

export const producerPageSize = 12;
const cookieName = "smile_producer_business";

const workspaceRow = z.object({
  business_id: z.uuid(),
  display_name: z.string(),
  slug: z.string(),
  approval_status: z.enum(approvalStatuses),
  business_kind: z.enum(businessKinds),
  member_role: z.enum(["owner", "representative"]),
  description: z.string(),
  country_code: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  website: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_phone: z.string().nullable(),
});

export type ProducerBusiness = {
  id: string;
  name: string;
  slug: string;
  approval: ApprovalStatus;
  kind: BusinessKind;
  role: "owner" | "representative";
  description: string;
  countryCode: string | null;
  city: string | null;
  district: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  state: WorkspaceState;
};

export type WorkspaceLoad =
  | { status: "unavailable"; message: string }
  | { status: "empty" }
  | { status: "choose"; businesses: ProducerBusiness[] }
  | { status: "blocked"; business: ProducerBusiness; businesses: ProducerBusiness[] }
  | { status: "ready"; business: ProducerBusiness; businesses: ProducerBusiness[] };

function mapBusiness(row: z.infer<typeof workspaceRow>): ProducerBusiness {
  return {
    id: row.business_id,
    name: row.display_name,
    slug: row.slug,
    approval: row.approval_status,
    kind: row.business_kind,
    role: row.member_role,
    description: row.description,
    countryCode: row.country_code,
    city: row.city,
    district: row.district,
    website: row.website,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    state: workspaceState({ approval: row.approval_status, kind: row.business_kind }),
  };
}

export const loadWorkspace = cache(async (): Promise<WorkspaceLoad> => {
  const { supabase } = await requireUser("/dashboard");
  const listed = await supabase.rpc("producer_workspaces");
  if (listed.error) {
    const missing = /schema cache|does not exist|could not find|function public\./i.test(listed.error.message);
    return {
      status: "unavailable",
      message: missing
        ? "The producer workspace is not available until the identity and producer migrations are applied."
        : "The producer workspace could not be loaded.",
    };
  }
  const parsed = z.array(workspaceRow).safeParse(listed.data ?? []);
  if (!parsed.success) {
    return { status: "unavailable", message: "The producer workspace could not be loaded." };
  }
  const businesses = parsed.data.map(mapBusiness);
  const resolved = resolveWorkspaceSelection(businesses, (await cookies()).get(cookieName)?.value);
  if (resolved.status === "empty" || resolved.status === "choose") {
    return resolved.status === "empty" ? { status: "empty" } : { status: "choose", businesses };
  }
  return { status: resolved.status, business: resolved.business, businesses };
});

export async function selectedBusinessId() {
  return (await cookies()).get(cookieName)?.value ?? null;
}

const managedImage = z.object({
  id: z.uuid(),
  storage_path: z.string(),
  alt_text: z.string(),
  display_order: z.number(),
  is_primary: z.boolean(),
});

const managedRow = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  publication_status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().nullable(),
  updated_at: z.string(),
  category_id: z.uuid(),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  brand_name: z.string().nullable().optional(),
  manufacturer_name: z.string().nullable().optional(),
  product_type: z.string().nullable().optional(),
  origin_country_code: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  product_images: z.array(managedImage).nullable().optional(),
});

export type ManagedImage = {
  id: string;
  path: string;
  alt: string;
  src: string | null;
  primary: boolean;
};

export type ManagedProduct = {
  id: string;
  name: string;
  slug: string;
  status: PublicationStatus;
  publishedAt: string | null;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
  summary: string;
  description: string;
  brandName: string;
  manufacturerName: string;
  productType: string;
  originCountryCode: string;
  ingredients: string;
  image: ManagedImage | null;
  images: ManagedImage[];
};

async function signManagedImage(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  image: z.infer<typeof managedImage>,
): Promise<ManagedImage> {
  if (!isSafeProductImagePath(image.storage_path)) {
    return { id: image.id, path: image.storage_path, alt: image.alt_text, src: null, primary: image.is_primary };
  }
  const signed = await supabase.storage.from("product-images").createSignedUrl(image.storage_path, 60 * 60);
  return {
    id: image.id,
    path: image.storage_path,
    alt: image.alt_text,
    src: signed.data?.signedUrl ?? null,
    primary: image.is_primary,
  };
}

async function categoryNames(ids: string[]) {
  const categories = await listCategories();
  const names = new Map<string, string>();
  if (categories.status === "ok") {
    for (const category of categories.categories) {
      if (ids.includes(category.id)) {
        names.set(category.id, category.name);
      }
    }
  }
  return names;
}

function toProduct(row: z.infer<typeof managedRow>, names: Map<string, string>, images: ManagedImage[]): ManagedProduct {
  const ordered = [...images].sort((a, b) => Number(b.primary) - Number(a.primary));
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.publication_status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    categoryId: row.category_id,
    categoryName: names.get(row.category_id) ?? "Category unavailable",
    summary: row.short_description ?? "",
    description: row.description ?? "",
    brandName: row.brand_name ?? "",
    manufacturerName: row.manufacturer_name ?? "",
    productType: row.product_type ?? "",
    originCountryCode: row.origin_country_code ?? "",
    ingredients: row.ingredients ?? "",
    image: ordered.find((image) => image.primary) ?? ordered[0] ?? null,
    images: ordered,
  };
}

export async function listManagedProducts(businessId: string, input: { q: string; label: string; page: number }) {
  const { supabase } = await requireUser("/dashboard/products");
  const page = Number.isInteger(input.page) && input.page >= 1 && input.page <= 500 ? input.page : 1;
  let query = supabase
    .from("products")
    .select(
      "id, name, slug, publication_status, published_at, updated_at, category_id, product_images(id, storage_path, alt_text, display_order, is_primary)",
      { count: "exact" },
    )
    .eq("business_id", businessId);
  const term = input.q.trim().slice(0, 80);
  if (term) {
    query = query.ilike("name", `%${escapeIlike(term)}%`);
  }
  if (input.label === "published" || input.label === "archived") {
    query = query.eq("publication_status", input.label);
  } else if (input.label === "draft") {
    query = query.eq("publication_status", "draft").is("published_at", null);
  } else if (input.label === "unpublished") {
    query = query.eq("publication_status", "draft").not("published_at", "is", null);
  }
  const from = (page - 1) * producerPageSize;
  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + producerPageSize - 1);
  if (error) {
    return { status: "unavailable" as const, message: "Listings could not be loaded." };
  }
  const parsed = z.array(managedRow).safeParse(data ?? []);
  if (!parsed.success) {
    return { status: "unavailable" as const, message: "Listings could not be loaded." };
  }
  const names = await categoryNames(parsed.data.map((row) => row.category_id));
  const products = await Promise.all(
    parsed.data.map(async (row) => {
      const images = await Promise.all((row.product_images ?? []).map((image) => signManagedImage(supabase, image)));
      return toProduct(row, names, images);
    }),
  );
  return { status: "ok" as const, products, total: count ?? products.length, page };
}

export async function getManagedProduct(businessId: string, productId: string) {
  const { supabase } = await requireUser("/dashboard/products");
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, publication_status, published_at, updated_at, category_id, short_description, description, brand_name, manufacturer_name, product_type, origin_country_code, ingredients, product_images(id, storage_path, alt_text, display_order, is_primary)",
    )
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  const parsed = managedRow.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  const names = await categoryNames([parsed.data.category_id]);
  const images = await Promise.all((parsed.data.product_images ?? []).map((image) => signManagedImage(supabase, image)));
  return toProduct(parsed.data, names, images);
}

export async function productCounts(businessId: string) {
  const { supabase } = await requireUser("/dashboard");
  const count = async (label: string) => {
    let query = supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", businessId);
    if (label === "published" || label === "archived") {
      query = query.eq("publication_status", label);
    } else if (label === "draft") {
      query = query.eq("publication_status", "draft").is("published_at", null);
    } else if (label === "unpublished") {
      query = query.eq("publication_status", "draft").not("published_at", "is", null);
    }
    const result = await query;
    return result.count ?? 0;
  };
  const [total, published, drafts, unpublished, archived] = await Promise.all([
    count("all"),
    count("published"),
    count("draft"),
    count("unpublished"),
    count("archived"),
  ]);
  return { total, published, drafts, unpublished, archived };
}

export async function recentProducts(businessId: string) {
  const { supabase } = await requireUser("/dashboard");
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, publication_status, published_at, updated_at, category_id")
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(5);
  if (error) {
    return [];
  }
  const parsed = z.array(managedRow).safeParse(data ?? []);
  if (!parsed.success) {
    return [];
  }
  const names = await categoryNames(parsed.data.map((row) => row.category_id));
  return parsed.data.map((row) => toProduct(row, names, []));
}
