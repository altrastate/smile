-- Phase 05 producer storefront and product management.
-- Depends on the catalogue migration and the three unapplied identity migrations.
-- Does not replace catalogue policies. Does not publish products when a business is approved.
-- Direct product writes stay revoked. Eligible producers call the functions below.

alter table public.businesses
  add column description text not null default '',
  add column country_code text,
  add column city text,
  add column district text,
  add column website text,
  add column contact_email text,
  add column contact_phone text;

alter table public.businesses
  add constraint businesses_description_length check (char_length(description) <= 2000),
  add constraint businesses_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  add constraint businesses_city_length check (city is null or char_length(city) between 1 and 80),
  add constraint businesses_district_length check (district is null or char_length(district) between 1 and 80),
  add constraint businesses_website_length check (website is null or char_length(website) between 1 and 200),
  add constraint businesses_website_https check (website is null or website ~ '^https://[^[:space:]]+$'),
  add constraint businesses_contact_email check (
    contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  add constraint businesses_contact_phone_length check (
    contact_phone is null or char_length(contact_phone) between 6 and 20
  );

comment on column public.businesses.contact_email is
  'Private storefront contact. Not granted to anonymous or authenticated catalogue reads.';
comment on column public.businesses.contact_phone is
  'Private storefront contact. Not granted to anonymous or authenticated catalogue reads.';

revoke select (contact_email, contact_phone) on table public.businesses from anon, authenticated;

create index products_business_updated_idx on public.products (business_id, updated_at desc);

alter table public.product_images
  add constraint product_images_path_safe check (
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

create table public.product_image_orphans (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  product_id uuid,
  reported_by uuid not null references auth.users (id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint product_image_orphans_reason_length check (char_length(reason) between 1 and 200),
  constraint product_image_orphans_path_length check (char_length(storage_path) between 1 and 400)
);

alter table public.product_image_orphans enable row level security;
revoke all on table public.product_image_orphans from public, anon, authenticated;
grant insert on table public.product_image_orphans to authenticated;
grant select on table public.product_image_orphans to authenticated;

create policy "Uploaders record their own product image orphans"
on public.product_image_orphans
for insert
to authenticated
with check (reported_by = (select auth.uid()));

create policy "Uploaders read their own product image orphans"
on public.product_image_orphans
for select
to authenticated
using (reported_by = (select auth.uid()));

create policy "Reviewers read product image orphans"
on public.product_image_orphans
for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('reviewer', 'admin')
  )
);

create or replace function private.copy_approved_storefront()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.businesses
    set
      description = case when description = '' then left(coalesce(new.description, ''), 2000) else description end,
      country_code = coalesce(country_code, new.country_code),
      city = coalesce(city, new.city),
      district = coalesce(district, new.district),
      website = coalesce(website, new.website),
      contact_email = coalesce(contact_email, new.business_email),
      contact_phone = coalesce(contact_phone, new.business_phone)
    where id = new.business_id;
  end if;
  return new;
end;
$$;

revoke all on function private.copy_approved_storefront() from public, anon, authenticated;

create trigger business_applications_copy_storefront
after update of status on public.business_applications
for each row
execute function private.copy_approved_storefront();

create or replace function private.assert_producer(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  kind public.business_kind;
  approval public.business_approval_status;
begin
  if actor is null then
    raise exception 'sign in required';
  end if;
  if not exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = actor
  ) then
    raise exception 'not a member of this business';
  end if;
  select business_kind into kind
  from public.business_applications
  where business_id = p_business_id;
  if kind is null then
    raise exception 'business application is missing';
  end if;
  if kind <> 'producer' then
    raise exception 'this workspace is only for producers';
  end if;
  select approval_status into approval
  from public.businesses
  where id = p_business_id;
  if approval is distinct from 'approved' then
    raise exception 'business is not approved';
  end if;
end;
$$;

revoke all on function private.assert_producer(uuid) from public, anon, authenticated;

create or replace function private.producer_workspaces()
returns table (
  business_id uuid,
  display_name text,
  slug text,
  approval_status public.business_approval_status,
  business_kind public.business_kind,
  member_role public.membership_role,
  description text,
  country_code text,
  city text,
  district text,
  website text,
  contact_email text,
  contact_phone text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'sign in required';
  end if;
  return query
  select
    b.id,
    b.display_name,
    b.slug,
    b.approval_status,
    a.business_kind,
    m.member_role,
    b.description,
    b.country_code,
    b.city,
    b.district,
    b.website,
    b.contact_email,
    b.contact_phone
  from public.business_members as m
  join public.businesses as b on b.id = m.business_id
  join public.business_applications as a on a.business_id = b.id
  where m.user_id = actor
  order by b.display_name;
end;
$$;

revoke all on function private.producer_workspaces() from public, anon, authenticated;

create or replace function private.update_producer_storefront(
  p_business_id uuid,
  p_display_name text,
  p_description text,
  p_country_code text,
  p_city text,
  p_district text,
  p_website text,
  p_contact_email text,
  p_contact_phone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_producer(p_business_id);
  update public.businesses
  set
    display_name = p_display_name,
    description = p_description,
    country_code = nullif(p_country_code, ''),
    city = nullif(p_city, ''),
    district = nullif(p_district, ''),
    website = nullif(p_website, ''),
    contact_email = nullif(p_contact_email, ''),
    contact_phone = nullif(p_contact_phone, '')
  where id = p_business_id;
  if not found then
    raise exception 'business was not updated';
  end if;
end;
$$;

revoke all on function private.update_producer_storefront(uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;

create or replace function private.create_producer_product(
  p_business_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_brand_name text,
  p_manufacturer_name text,
  p_product_type text,
  p_origin_country_code text,
  p_ingredients text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created uuid;
begin
  perform private.assert_producer(p_business_id);
  if not exists (
    select 1 from public.categories
    where id = p_category_id and is_active
  ) then
    raise exception 'category is not active';
  end if;
  if exists (select 1 from public.products where slug = p_slug) then
    raise exception 'slug is already used';
  end if;
  insert into public.products (
    business_id,
    category_id,
    name,
    slug,
    short_description,
    description,
    brand_name,
    manufacturer_name,
    product_type,
    origin_country_code,
    ingredients,
    publication_status
  )
  values (
    p_business_id,
    p_category_id,
    p_name,
    p_slug,
    nullif(p_short_description, ''),
    nullif(p_description, ''),
    nullif(p_brand_name, ''),
    nullif(p_manufacturer_name, ''),
    nullif(p_product_type, ''),
    nullif(p_origin_country_code, ''),
    nullif(p_ingredients, ''),
    'draft'
  )
  returning id into created;
  return created;
end;
$$;

revoke all on function private.create_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;

create or replace function private.update_producer_product(
  p_product_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_brand_name text,
  p_manufacturer_name text,
  p_product_type text,
  p_origin_country_code text,
  p_ingredients text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select business_id into owner from public.products where id = p_product_id for update;
  if owner is null then
    raise exception 'product was not found';
  end if;
  perform private.assert_producer(owner);
  if not exists (
    select 1 from public.categories
    where id = p_category_id and is_active
  ) then
    raise exception 'category is not active';
  end if;
  if exists (select 1 from public.products where slug = p_slug and id <> p_product_id) then
    raise exception 'slug is already used';
  end if;
  update public.products
  set
    category_id = p_category_id,
    name = p_name,
    slug = p_slug,
    short_description = nullif(p_short_description, ''),
    description = nullif(p_description, ''),
    brand_name = nullif(p_brand_name, ''),
    manufacturer_name = nullif(p_manufacturer_name, ''),
    product_type = nullif(p_product_type, ''),
    origin_country_code = nullif(p_origin_country_code, ''),
    ingredients = nullif(p_ingredients, '')
  where id = p_product_id;
end;
$$;

revoke all on function private.update_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;

create or replace function private.set_producer_product_status(
  p_product_id uuid,
  p_status public.product_publication_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  current_status public.product_publication_status;
  category uuid;
begin
  select business_id, publication_status, category_id
  into owner, current_status, category
  from public.products
  where id = p_product_id
  for update;
  if owner is null then
    raise exception 'product was not found';
  end if;
  perform private.assert_producer(owner);
  if current_status = p_status then
    raise exception 'status is unchanged';
  end if;
  if not (
    (current_status = 'draft' and p_status in ('published', 'archived'))
    or (current_status = 'published' and p_status in ('draft', 'archived'))
    or (current_status = 'archived' and p_status = 'draft')
  ) then
    raise exception 'status change is not allowed';
  end if;
  if p_status = 'published' and not exists (
    select 1 from public.categories where id = category and is_active
  ) then
    raise exception 'category is not active';
  end if;
  update public.products
  set
    publication_status = p_status,
    published_at = case
      when p_status = 'published' then coalesce(published_at, now())
      else published_at
    end
  where id = p_product_id;
end;
$$;

revoke all on function private.set_producer_product_status(uuid, public.product_publication_status) from public, anon, authenticated;

create or replace function private.attach_product_image(
  p_product_id uuid,
  p_storage_path text,
  p_alt_text text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  created uuid;
  image_count integer;
  has_primary boolean;
begin
  select business_id into owner from public.products where id = p_product_id for update;
  if owner is null then
    raise exception 'product was not found';
  end if;
  perform private.assert_producer(owner);
  if p_storage_path !~ (
    '^' || owner::text || '/' || p_product_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  ) then
    raise exception 'image path is not valid';
  end if;
  select count(*) into image_count from public.product_images where product_id = p_product_id;
  if image_count >= 8 then
    raise exception 'too many images';
  end if;
  select exists (
    select 1 from public.product_images where product_id = p_product_id and is_primary
  ) into has_primary;
  insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
  values (p_product_id, p_storage_path, p_alt_text, image_count, not has_primary)
  returning id into created;
  return created;
end;
$$;

revoke all on function private.attach_product_image(uuid, text, text) from public, anon, authenticated;

create or replace function private.remove_product_image(p_image_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  product uuid;
  path text;
  was_primary boolean;
  replacement uuid;
begin
  select products.business_id, images.product_id, images.storage_path, images.is_primary
  into owner, product, path, was_primary
  from public.product_images as images
  join public.products as products on products.id = images.product_id
  where images.id = p_image_id
  for update of images;
  if owner is null then
    raise exception 'image was not found';
  end if;
  perform private.assert_producer(owner);
  delete from public.product_images where id = p_image_id;
  if was_primary then
    select id into replacement
    from public.product_images
    where product_id = product
    order by display_order, created_at
    limit 1;
    if replacement is not null then
      update public.product_images set is_primary = true where id = replacement;
    end if;
  end if;
  return path;
end;
$$;

revoke all on function private.remove_product_image(uuid) from public, anon, authenticated;

create or replace function private.producer_may_store_image(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  business_id uuid;
  product_id uuid;
begin
  if actor is null or object_name is null then
    return false;
  end if;
  if object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    return false;
  end if;
  business_id := split_part(object_name, '/', 1)::uuid;
  product_id := split_part(object_name, '/', 2)::uuid;
  return exists (
    select 1
    from public.products as p
    join public.business_members as m on m.business_id = p.business_id and m.user_id = actor
    join public.businesses as b on b.id = p.business_id
    join public.business_applications as a on a.business_id = b.id
    where p.id = product_id
      and p.business_id = business_id
      and b.approval_status = 'approved'
      and a.business_kind = 'producer'
  );
end;
$$;

revoke all on function private.producer_may_store_image(text) from public, anon, authenticated;

create or replace function public.producer_workspaces()
returns table (
  business_id uuid,
  display_name text,
  slug text,
  approval_status public.business_approval_status,
  business_kind public.business_kind,
  member_role public.membership_role,
  description text,
  country_code text,
  city text,
  district text,
  website text,
  contact_email text,
  contact_phone text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  return query select * from private.producer_workspaces();
end;
$$;

create or replace function public.update_producer_storefront(
  p_business_id uuid,
  p_display_name text,
  p_description text,
  p_country_code text,
  p_city text,
  p_district text,
  p_website text,
  p_contact_email text,
  p_contact_phone text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.update_producer_storefront(
    p_business_id,
    p_display_name,
    p_description,
    p_country_code,
    p_city,
    p_district,
    p_website,
    p_contact_email,
    p_contact_phone
  );
end;
$$;

create or replace function public.create_producer_product(
  p_business_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_brand_name text,
  p_manufacturer_name text,
  p_product_type text,
  p_origin_country_code text,
  p_ingredients text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.create_producer_product(
    p_business_id,
    p_category_id,
    p_name,
    p_slug,
    p_short_description,
    p_description,
    p_brand_name,
    p_manufacturer_name,
    p_product_type,
    p_origin_country_code,
    p_ingredients
  );
end;
$$;

create or replace function public.update_producer_product(
  p_product_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_brand_name text,
  p_manufacturer_name text,
  p_product_type text,
  p_origin_country_code text,
  p_ingredients text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.update_producer_product(
    p_product_id,
    p_category_id,
    p_name,
    p_slug,
    p_short_description,
    p_description,
    p_brand_name,
    p_manufacturer_name,
    p_product_type,
    p_origin_country_code,
    p_ingredients
  );
end;
$$;

create or replace function public.set_producer_product_status(
  p_product_id uuid,
  p_status public.product_publication_status
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.set_producer_product_status(p_product_id, p_status);
end;
$$;

create or replace function public.attach_product_image(
  p_product_id uuid,
  p_storage_path text,
  p_alt_text text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.attach_product_image(p_product_id, p_storage_path, p_alt_text);
end;
$$;

create or replace function public.remove_product_image(p_image_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.remove_product_image(p_image_id);
end;
$$;

create or replace function public.producer_may_store_image(object_name text)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  return private.producer_may_store_image(object_name);
end;
$$;

revoke all on function public.producer_workspaces() from public, anon;
revoke all on function public.update_producer_storefront(uuid, text, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.create_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.update_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.set_producer_product_status(uuid, public.product_publication_status) from public, anon;
revoke all on function public.attach_product_image(uuid, text, text) from public, anon;
revoke all on function public.remove_product_image(uuid) from public, anon;
revoke all on function public.producer_may_store_image(text) from public, anon;

grant execute on function public.producer_workspaces() to authenticated;
grant execute on function public.update_producer_storefront(uuid, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.create_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.update_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.set_producer_product_status(uuid, public.product_publication_status) to authenticated;
grant execute on function public.attach_product_image(uuid, text, text) to authenticated;
grant execute on function public.remove_product_image(uuid) to authenticated;
grant execute on function public.producer_may_store_image(text) to authenticated;

create policy "Producer members read their products"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.business_members as member
    join public.businesses as business on business.id = member.business_id
    join public.business_applications as application on application.business_id = business.id
    where member.user_id = (select auth.uid())
      and member.business_id = products.business_id
      and business.approval_status = 'approved'
      and application.business_kind = 'producer'
  )
);

create policy "Producers upload their product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.producer_may_store_image(name)
);

create policy "Producers delete their product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.producer_may_store_image(name)
);

comment on function public.create_producer_product(uuid, uuid, text, text, text, text, text, text, text, text, text) is
  'Creates a draft product for an approved producer business. Publication is a separate call and does not change business approval.';
