import "server-only";

import { z } from "zod";
import { hasPublicEnv } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/features/catalogue/params";
import { categoryNamePattern, postgrestSearchOr, productSearch } from "@/features/catalogue/search";

export const pageSize = 12;

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const imageSchema = z.object({
  storage_path: z.string(),
  alt_text: z.string(),
  display_order: z.number(),
  is_primary: z.boolean(),
});

const listedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: slugSchema,
  short_description: z.string().nullable(),
  published_at: z.string().nullable(),
  categories: z.object({
    name: z.string(),
    slug: slugSchema,
    is_active: z.boolean(),
  }),
  businesses: z.object({
    display_name: z.string(),
    slug: slugSchema,
    approval_status: z.string(),
  }),
  product_images: z.array(imageSchema).nullable(),
});

const detailedProductSchema = listedProductSchema.extend({
  description: z.string().nullable(),
  brand_name: z.string().nullable(),
  manufacturer_name: z.string().nullable(),
  product_type: z.string().nullable(),
  origin_country_code: z.string().nullable(),
  ingredients: z.string().nullable(),
});

const categorySchema = z.object({
  id: z.string(),
  parent_id: z.string().nullable(),
  name: z.string(),
  slug: slugSchema,
  description: z.string(),
  display_order: z.number(),
});

export type CatalogueImage = {
  src: string | null;
  alt: string;
};

export type CatalogueProduct = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  categoryName: string;
  categorySlug: string;
  businessName: string;
  businessSlug: string;
  image: CatalogueImage;
};

export type CatalogueProductDetail = CatalogueProduct & {
  description: string | null;
  brandName: string | null;
  manufacturerName: string | null;
  productType: string | null;
  origin: string | null;
  ingredients: string | null;
  images: CatalogueImage[];
};

export type CatalogueCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
};

export type CatalogueQuery =
  | { status: "ok" }
  | { status: "unavailable"; message: string };

export type ProductListResult =
  | { status: "ok"; products: CatalogueProduct[]; total: number }
  | { status: "unavailable"; message: string };

export type ProductDetailResult =
  | { status: "ok"; product: CatalogueProductDetail | null }
  | { status: "unavailable"; message: string };

export type CategoryListResult =
  | { status: "ok"; categories: CatalogueCategory[] }
  | { status: "unavailable"; message: string };

export type CategoryResult =
  | { status: "ok"; category: CatalogueCategory | null }
  | { status: "unavailable"; message: string };

const listSelect =
  "id, name, slug, short_description, published_at, categories!inner(name, slug, is_active), businesses!inner(display_name, slug, approval_status), product_images(storage_path, alt_text, display_order, is_primary)";

const detailSelect =
  "id, name, slug, short_description, description, brand_name, manufacturer_name, product_type, origin_country_code, ingredients, published_at, categories!inner(name, slug, is_active), businesses!inner(display_name, slug, approval_status), product_images(storage_path, alt_text, display_order, is_primary)";

function unavailable(error: unknown): { status: "unavailable"; message: string } {
  const appError = toAppError(error);
  console.error("Catalogue query failed:", appError.message);
  const missing =
    /does not exist|schema cache|could not find the table|relation/i.test(appError.message);
  return {
    status: "unavailable",
    message: missing
      ? "The catalogue database is not available yet."
      : "The catalogue could not be loaded.",
  };
}

function originLabel(code: string | null) {
  if (!code) {
    return null;
  }
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

async function signImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  image: z.infer<typeof imageSchema> | undefined,
): Promise<CatalogueImage> {
  if (!image) {
    return { src: null, alt: "" };
  }
  const signed = await supabase.storage.from("product-images").createSignedUrl(image.storage_path, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) {
    console.error("Product image URL failed:", signed.error?.message ?? "No signed URL was returned.");
    return { src: null, alt: image.alt_text };
  }
  return { src: signed.data.signedUrl, alt: image.alt_text };
}

function primaryImage(images: z.infer<typeof imageSchema>[] | null) {
  const rows = [...(images ?? [])].sort((a, b) => a.display_order - b.display_order);
  return rows.find((image) => image.is_primary) ?? rows[0];
}

export async function listCategories(): Promise<CategoryListResult> {
  if (!hasPublicEnv()) {
    return { status: "unavailable", message: "The catalogue database is not configured." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, parent_id, name, slug, description, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return unavailable(error);
    }

    const parsed = z.array(categorySchema).safeParse(data ?? []);
    if (!parsed.success) {
      return unavailable(parsed.error);
    }

    return {
      status: "ok",
      categories: parsed.data.map((category) => ({
        id: category.id,
        parentId: category.parent_id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.display_order,
      })),
    };
  } catch (error) {
    return unavailable(error);
  }
}

export async function getCategory(slug: string): Promise<CategoryResult> {
  if (!slugSchema.safeParse(slug).success) {
    return { status: "ok", category: null };
  }

  if (!hasPublicEnv()) {
    return { status: "unavailable", message: "The catalogue database is not configured." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, parent_id, name, slug, description, display_order")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return unavailable(error);
    }

    if (!data) {
      return { status: "ok", category: null };
    }

    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      return unavailable(parsed.error);
    }

    return {
      status: "ok",
      category: {
        id: parsed.data.id,
        parentId: parsed.data.parent_id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        displayOrder: parsed.data.display_order,
      },
    };
  } catch (error) {
    return unavailable(error);
  }
}

export async function listProducts(input: {
  q?: string;
  category?: string;
  sort: "newest" | "name";
  page: number;
}): Promise<ProductListResult> {
  if (!hasPublicEnv()) {
    return { status: "unavailable", message: "The catalogue database is not configured." };
  }

  try {
    const supabase = await createClient();
    const term = sanitizeSearch(input.q);
    let categoryIds: string[] = [];

    if (term) {
      const matched = await supabase
        .from("categories")
        .select("id")
        .eq("is_active", true)
        .ilike("name", categoryNamePattern(term));
      if (matched.error) {
        return unavailable(matched.error);
      }
      const parsedIds = z.array(z.object({ id: z.string().uuid() })).safeParse(matched.data ?? []);
      if (!parsedIds.success) {
        return unavailable(parsedIds.error);
      }
      categoryIds = parsedIds.data.map((row) => row.id);
    }

    const search = productSearch(term, categoryIds);
    const page = Number.isInteger(input.page) && input.page >= 1 && input.page <= 500 ? input.page : 1;

    const listing = (head = false) => {
      let query = supabase
        .from("products")
        .select(listSelect, { count: "exact", head })
        .eq("publication_status", "published")
        .eq("categories.is_active", true)
        .eq("businesses.approval_status", "approved");

      if (input.category && slugSchema.safeParse(input.category).success) {
        query = query.eq("categories.slug", input.category);
      }

      if (search.kind === "text") {
        query = query.textSearch("search_vector", search.term, { type: "websearch", config: "simple" });
      } else if (search.kind === "text-or-categories") {
        query = query.or(postgrestSearchOr(search.term, search.categoryIds));
      }

      return input.sort === "name"
        ? query.order("name", { ascending: true }).order("id", { ascending: true })
        : query
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("name", { ascending: true })
            .order("id", { ascending: true });
    };

    const from = (page - 1) * pageSize;
    const { data, error, count } = await listing().range(from, from + pageSize - 1);

    if (error && /range not satisfiable/i.test(error.message)) {
      const recount = await listing(true);
      if (recount.error) {
        return unavailable(recount.error);
      }
      return { status: "ok", products: [], total: recount.count ?? 0 };
    }

    if (error) {
      return unavailable(error);
    }

    const parsed = z.array(listedProductSchema).safeParse(data ?? []);
    if (!parsed.success) {
      return unavailable(parsed.error);
    }

    const products = await Promise.all(
      parsed.data.map(async (product) => {
        const image = await signImage(supabase, primaryImage(product.product_images));
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          summary: product.short_description,
          categoryName: product.categories.name,
          categorySlug: product.categories.slug,
          businessName: product.businesses.display_name,
          businessSlug: product.businesses.slug,
          image,
        };
      }),
    );

    return { status: "ok", products, total: count ?? products.length };
  } catch (error) {
    return unavailable(error);
  }
}

export async function getProduct(slug: string): Promise<ProductDetailResult> {
  if (!slugSchema.safeParse(slug).success) {
    return { status: "ok", product: null };
  }

  if (!hasPublicEnv()) {
    return { status: "unavailable", message: "The catalogue database is not configured." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(detailSelect)
      .eq("slug", slug)
      .eq("publication_status", "published")
      .eq("categories.is_active", true)
      .eq("businesses.approval_status", "approved")
      .maybeSingle();

    if (error) {
      return unavailable(error);
    }

    if (!data) {
      return { status: "ok", product: null };
    }

    const parsed = detailedProductSchema.safeParse(data);
    if (!parsed.success) {
      return unavailable(parsed.error);
    }

    const rows = [...(parsed.data.product_images ?? [])].sort((a, b) => a.display_order - b.display_order);
    const images = await Promise.all(rows.map((image) => signImage(supabase, image)));
    const image = images.find((item) => item.src) ?? (await signImage(supabase, primaryImage(rows)));

    return {
      status: "ok",
      product: {
        id: parsed.data.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        summary: parsed.data.short_description,
        description: parsed.data.description,
        categoryName: parsed.data.categories.name,
        categorySlug: parsed.data.categories.slug,
        businessName: parsed.data.businesses.display_name,
        businessSlug: parsed.data.businesses.slug,
        brandName: parsed.data.brand_name,
        manufacturerName: parsed.data.manufacturer_name,
        productType: parsed.data.product_type,
        origin: originLabel(parsed.data.origin_country_code),
        ingredients: parsed.data.ingredients,
        image,
        images: images.filter((item) => item.src),
      },
    };
  } catch (error) {
    return unavailable(error);
  }
}
