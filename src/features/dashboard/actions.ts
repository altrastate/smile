"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import { loadWorkspace } from "@/features/dashboard/queries";
import { canSetPublication, type PublicationStatus } from "@/features/dashboard/eligibility";
import {
  detectProductImage,
  isSafeProductImagePath,
  productImagePath,
} from "@/features/dashboard/images";
import { productSchema, productSlug, storefrontSchema } from "@/features/dashboard/validation";

const cookieName = "smile_producer_business";

function failure(path: string, error: { message: string }) {
  if (/schema cache|does not exist|could not find|function public\./i.test(error.message)) {
    return `${path}?error=unavailable`;
  }
  if (/not a member|not approved|only for producers|was not found|sign in required/i.test(error.message)) {
    return `${path}?error=forbidden`;
  }
  if (/not active|already used|not allowed|unchanged|too many|not valid|path/i.test(error.message)) {
    return `${path}?error=invalid`;
  }
  return `${path}?error=save`;
}

async function readyBusiness() {
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    redirect("/dashboard");
  }
  return workspace.business;
}

function refreshCatalogue(slug: string, productSlugValue?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/shop");
  revalidatePath(`/businesses/${slug}`);
  if (productSlugValue) {
    revalidatePath(`/shop/${productSlugValue}`);
  }
}

export async function selectBusiness(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  if (!z.uuid().safeParse(businessId).success) {
    redirect("/dashboard?error=invalid");
  }
  const { supabase } = await requireUser("/dashboard");
  const listed = await supabase.rpc("producer_workspaces");
  const owns = (listed.data ?? []).some((row) => row.business_id === businessId);
  if (!owns) {
    redirect("/dashboard?error=forbidden");
  }
  const jar = await cookies();
  jar.set(cookieName, businessId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/dashboard");
}

export async function updateStorefront(formData: FormData) {
  const business = await readyBusiness();
  const parsed = storefrontSchema.safeParse({
    displayName: formData.get("displayName"),
    description: formData.get("description") ?? "",
    countryCode: formData.get("countryCode") ?? "",
    city: formData.get("city") ?? "",
    district: formData.get("district") ?? "",
    website: formData.get("website") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
  });
  if (!parsed.success || String(formData.get("businessId") ?? "") !== business.id) {
    redirect("/dashboard/storefront?error=invalid");
  }
  const { supabase } = await requireUser("/dashboard/storefront");
  const saved = await supabase.rpc("update_producer_storefront", {
    p_business_id: business.id,
    p_display_name: parsed.data.displayName,
    p_description: parsed.data.description,
    p_country_code: parsed.data.countryCode,
    p_city: parsed.data.city,
    p_district: parsed.data.district,
    p_website: parsed.data.website,
    p_contact_email: parsed.data.contactEmail,
    p_contact_phone: parsed.data.contactPhone,
  });
  if (saved.error) {
    redirect(failure("/dashboard/storefront", saved.error));
  }
  refreshCatalogue(business.slug);
  redirect("/dashboard/storefront?status=saved");
}

function readProduct(formData: FormData, fallbackSlug: string) {
  const name = String(formData.get("name") ?? "");
  const requested = String(formData.get("slug") ?? "").trim();
  return productSchema.safeParse({
    name,
    slug: requested || fallbackSlug,
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription") ?? "",
    description: formData.get("description") ?? "",
    brandName: formData.get("brandName") ?? "",
    manufacturerName: formData.get("manufacturerName") ?? "",
    productType: formData.get("productType") ?? "",
    originCountryCode: formData.get("originCountryCode") ?? "",
    ingredients: formData.get("ingredients") ?? "",
  });
}

function productArgs(data: z.infer<typeof productSchema>) {
  return {
    p_category_id: data.categoryId,
    p_name: data.name,
    p_slug: data.slug,
    p_short_description: data.shortDescription,
    p_description: data.description,
    p_brand_name: data.brandName,
    p_manufacturer_name: data.manufacturerName,
    p_product_type: data.productType,
    p_origin_country_code: data.originCountryCode,
    p_ingredients: data.ingredients,
  };
}

export async function createProduct(formData: FormData) {
  const business = await readyBusiness();
  const parsed = readProduct(formData, productSlug(String(formData.get("name") ?? ""), randomUUID()));
  if (!parsed.success) {
    redirect("/dashboard/products/new?error=invalid");
  }
  const { supabase } = await requireUser("/dashboard/products/new");
  const created = await supabase.rpc("create_producer_product", {
    p_business_id: business.id,
    ...productArgs(parsed.data),
  });
  if (created.error || !created.data) {
    redirect(failure("/dashboard/products/new", created.error ?? { message: "missing" }));
  }
  refreshCatalogue(business.slug, parsed.data.slug);
  redirect(`/dashboard/products/${created.data}/edit?status=created`);
}

export async function updateProduct(formData: FormData) {
  const business = await readyBusiness();
  const productId = String(formData.get("productId") ?? "");
  if (!z.uuid().safeParse(productId).success) {
    redirect("/dashboard/products?error=invalid");
  }
  const parsed = readProduct(formData, productSlug(String(formData.get("name") ?? ""), productId));
  if (!parsed.success) {
    redirect(`/dashboard/products/${productId}/edit?error=invalid`);
  }
  const { supabase } = await requireUser(`/dashboard/products/${productId}/edit`);
  const current = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!current.data) {
    redirect("/dashboard/products?error=forbidden");
  }
  const saved = await supabase.rpc("update_producer_product", {
    p_product_id: productId,
    ...productArgs(parsed.data),
  });
  if (saved.error) {
    redirect(failure(`/dashboard/products/${productId}/edit`, saved.error));
  }
  refreshCatalogue(business.slug, current.data.slug);
  refreshCatalogue(business.slug, parsed.data.slug);
  redirect(`/dashboard/products/${productId}/edit?status=saved`);
}

export async function setProductStatus(formData: FormData) {
  const business = await readyBusiness();
  const productId = String(formData.get("productId") ?? "");
  const next = String(formData.get("status") ?? "");
  const back = String(formData.get("returnTo") ?? "/dashboard/products");
  const safeBack = back.startsWith("/dashboard/products") ? back.split("?")[0] : "/dashboard/products";
  if (!z.uuid().safeParse(productId).success || !["draft", "published", "archived"].includes(next)) {
    redirect(`${safeBack}?error=invalid`);
  }
  if (next === "archived" && formData.get("confirm") !== "on") {
    redirect(`${safeBack}?error=confirm`);
  }
  const { supabase } = await requireUser(safeBack);
  const current = await supabase
    .from("products")
    .select("publication_status, slug")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!current.data) {
    redirect("/dashboard/products?error=forbidden");
  }
  const from = current.data.publication_status as PublicationStatus;
  if (!canSetPublication(from, next as PublicationStatus)) {
    redirect(`${safeBack}?error=invalid`);
  }
  const saved = await supabase.rpc("set_producer_product_status", {
    p_product_id: productId,
    p_status: next as PublicationStatus,
  });
  if (saved.error) {
    redirect(failure(safeBack, saved.error));
  }
  refreshCatalogue(business.slug, current.data.slug);
  redirect(`${safeBack}?notice=updated`);
}

export async function uploadProductImage(formData: FormData) {
  const business = await readyBusiness();
  const productId = String(formData.get("productId") ?? "");
  const editPath = `/dashboard/products/${productId}/edit`;
  if (!z.uuid().safeParse(productId).success) {
    redirect("/dashboard/products?error=invalid");
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${editPath}?error=invalid`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectProductImage(bytes);
  const declared = file.type;
  if (!detected || (declared && declared !== "application/octet-stream" && declared !== detected)) {
    redirect(`${editPath}?error=invalid`);
  }
  const { supabase, user } = await requireUser(editPath);
  const product = await supabase
    .from("products")
    .select("name, slug")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!product.data) {
    redirect("/dashboard/products?error=forbidden");
  }
  const path = productImagePath(business.id, productId, randomUUID(), detected);
  const uploaded = await supabase.storage.from("product-images").upload(path, bytes, {
    contentType: detected,
    upsert: false,
  });
  if (uploaded.error) {
    redirect(failure(editPath, uploaded.error));
  }
  const alt = product.data.name.slice(0, 180);
  const attached = await supabase.rpc("attach_product_image", {
    p_product_id: productId,
    p_storage_path: path,
    p_alt_text: alt,
  });
  if (attached.error || !attached.data) {
    const removed = await supabase.storage.from("product-images").remove([path]);
    if (removed.error) {
      const orphan = await supabase.from("product_image_orphans").insert({
        storage_path: path,
        product_id: productId,
        reported_by: user.id,
        reason: "database insert failed and storage removal failed",
      });
      if (orphan.error) {
        console.error("product image orphan was not recorded", productId);
      }
      redirect(`${editPath}?error=orphan`);
    }
    redirect(failure(editPath, attached.error ?? { message: "missing" }));
  }
  refreshCatalogue(business.slug, product.data.slug);
  redirect(`${editPath}?status=image`);
}

export async function removeProductImage(formData: FormData) {
  const business = await readyBusiness();
  const productId = String(formData.get("productId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  const editPath = `/dashboard/products/${productId}/edit`;
  if (!z.uuid().safeParse(productId).success || !z.uuid().safeParse(imageId).success) {
    redirect("/dashboard/products?error=invalid");
  }
  if (formData.get("confirm") !== "on") {
    redirect(`${editPath}?error=confirm`);
  }
  const { supabase, user } = await requireUser(editPath);
  const product = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!product.data) {
    redirect("/dashboard/products?error=forbidden");
  }
  const removed = await supabase.rpc("remove_product_image", { p_image_id: imageId });
  if (removed.error || !removed.data || !isSafeProductImagePath(removed.data)) {
    redirect(failure(editPath, removed.error ?? { message: "image path is not valid" }));
  }
  const storage = await supabase.storage.from("product-images").remove([removed.data]);
  if (storage.error) {
    const orphan = await supabase.from("product_image_orphans").insert({
      storage_path: removed.data,
      product_id: productId,
      reported_by: user.id,
      reason: "image row was removed and storage removal failed",
    });
    if (orphan.error) {
      console.error("product image orphan was not recorded", productId);
    }
    redirect(`${editPath}?error=orphan`);
  }
  refreshCatalogue(business.slug, product.data.slug);
  redirect(`${editPath}?status=image`);
}
