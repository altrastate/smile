import { z } from "zod";

export const producerCountries = ["UG", "KE", "TZ", "RW", "BI", "SS"] as const;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalText = (max: number) => z.string().trim().max(max);
const httpsUrl = z.string().trim().max(200).regex(/^https:\/\/\S+$/);

export const storefrontSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000),
  countryCode: z.union([z.literal(""), z.enum(producerCountries)]),
  city: optionalText(80),
  district: optionalText(80),
  website: z.union([z.literal(""), httpsUrl]),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(160)]),
  contactPhone: z.union([z.literal(""), z.string().trim().regex(/^[0-9+(). -]{6,20}$/)]),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  categoryId: z.uuid(),
  shortDescription: optionalText(280),
  description: optionalText(4000),
  brandName: optionalText(120),
  manufacturerName: optionalText(120),
  productType: optionalText(80),
  originCountryCode: z.union([z.literal(""), z.enum(producerCountries)]),
  ingredients: optionalText(2000),
});

export function productSlug(name: string, suffix: string) {
  const base = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const tail = suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${base || "product"}-${tail || "listing"}`;
}

export function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}
