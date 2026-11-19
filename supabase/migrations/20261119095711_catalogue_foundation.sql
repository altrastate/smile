-- Catalogue foundation for Phase 03.
-- businesses is only a public identity for product attribution.
-- Phase 04 adds profiles, applications, ownership, and the approval workflow.
-- This migration does not create products.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create type public.business_approval_status as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type public.product_publication_status as enum (
  'draft',
  'published',
  'archived'
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  slug text not null,
  approval_status public.business_approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_display_name_length check (char_length(display_name) between 2 and 120),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index businesses_slug_key on public.businesses (slug);
create index businesses_approval_status_idx on public.businesses (approval_status);

comment on table public.businesses is
  'Public business identity used to attribute products. Approval is separate from product publication. Phase 04 extends this table with ownership and applications.';

create trigger businesses_set_updated_at
before update on public.businesses
for each row
execute function private.set_updated_at();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null,
  description text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(name) between 2 and 80),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_description_length check (char_length(description) between 2 and 280),
  constraint categories_display_order_nonnegative check (display_order >= 0),
  constraint categories_parent_not_self check (parent_id is distinct from id)
);

create unique index categories_slug_key on public.categories (slug);
create index categories_parent_id_idx on public.categories (parent_id);
create index categories_active_order_idx on public.categories (display_order, name) where is_active;

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function private.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null,
  short_description text,
  description text,
  brand_name text,
  manufacturer_name text,
  product_type text,
  origin_country_code text,
  ingredients text,
  publication_status public.product_publication_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(brand_name, '') || ' ' ||
      coalesce(manufacturer_name, '') || ' ' ||
      coalesce(product_type, '') || ' ' ||
      coalesce(ingredients, '')
    )
  ) stored,
  constraint products_name_length check (char_length(name) between 2 and 160),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_origin_country_code_format check (
    origin_country_code is null or origin_country_code ~ '^[A-Z]{2}$'
  ),
  constraint products_published_has_timestamp check (
    publication_status <> 'published' or published_at is not null
  )
);

create unique index products_slug_key on public.products (slug);
create index products_business_id_idx on public.products (business_id);
create index products_category_id_idx on public.products (category_id);
create index products_published_listing_idx
  on public.products (published_at desc, id)
  where publication_status = 'published';
create index products_search_vector_idx on public.products using gin (search_vector);

create trigger products_set_updated_at
before update on public.products
for each row
execute function private.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_storage_path_length check (char_length(storage_path) between 1 and 400),
  constraint product_images_alt_text_length check (char_length(alt_text) between 1 and 180),
  constraint product_images_display_order_nonnegative check (display_order >= 0)
);

create index product_images_product_order_idx
  on public.product_images (product_id, display_order);
create unique index product_images_one_primary_idx
  on public.product_images (product_id)
  where is_primary;

comment on table public.product_images is
  'Image metadata for a product. The file lives in the private product-images bucket. Phase 05 adds the upload interface.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

alter table public.businesses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

revoke all on table public.businesses from public, anon, authenticated;
revoke all on table public.categories from public, anon, authenticated;
revoke all on table public.products from public, anon, authenticated;
revoke all on table public.product_images from public, anon, authenticated;

grant select on table public.businesses to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.product_images to anon, authenticated;

create policy "Public reads approved businesses"
on public.businesses
for select
to anon, authenticated
using (approval_status = 'approved');

create policy "Public reads active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy "Public reads published products of approved businesses"
on public.products
for select
to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1
    from public.businesses
    where businesses.id = products.business_id
      and businesses.approval_status = 'approved'
  )
  and exists (
    select 1
    from public.categories
    where categories.id = products.category_id
      and categories.is_active = true
  )
);

create policy "Public reads images of visible products"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
  )
);

create policy "Public reads published product image files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.product_images
    where product_images.storage_path = objects.name
  )
);

insert into public.categories (name, slug, description, display_order)
values
  ('Natural foods', 'natural-foods', 'Foods from farms and producers.', 1),
  ('Herbal products', 'herbal-products', 'Preparations made from plants.', 2),
  ('Nutritional supplements', 'nutritional-supplements', 'Products intended to supplement the diet.', 3),
  ('Botanical ingredients', 'botanical-ingredients', 'Materials for makers and manufacturers.', 4),
  ('Organic agricultural products', 'organic-agricultural-products', 'Crops and produce from growers.', 5),
  ('Natural personal care', 'natural-personal-care', 'Care products based on natural ingredients.', 6);
