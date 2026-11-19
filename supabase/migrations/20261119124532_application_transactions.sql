-- Phase 04.1 atomic application operations.
-- Privileged work stays in private. Public wrappers are security invoker so PostgREST can call them.
-- Apply after 20261119124504_application_history_guards.sql. Not applied in this phase.
-- These functions do not update products.

create or replace function private.start_business_application(p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  business_id uuid;
  application_id uuid;
begin
  if actor is null then
    raise exception 'authentication is required';
  end if;
  if p_slug is null
    or char_length(p_slug) < 3
    or char_length(p_slug) > 60
    or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception 'business slug is not valid';
  end if;

  insert into public.businesses (display_name, slug, approval_status, created_by)
  values ('New business', p_slug, 'pending', actor)
  returning id into business_id;

  insert into public.business_applications (applicant_id, business_id, status, business_kind)
  values (actor, business_id, 'draft', 'producer')
  returning id into application_id;

  insert into public.business_members (business_id, user_id, member_role)
  values (business_id, actor, 'owner');

  insert into public.business_application_events (application_id, actor_id, event, from_status, to_status)
  values (application_id, actor, 'created', null, 'draft');

  return application_id;
end;
$$;

create or replace function private.save_business_application(
  p_application_id uuid,
  p_display_name text,
  p_slug text,
  p_status public.application_status,
  p_business_kind public.business_kind,
  p_description text,
  p_country_code text,
  p_district text,
  p_city text,
  p_address text,
  p_website text,
  p_business_email text,
  p_business_phone text,
  p_whatsapp_phone text,
  p_registration_standing public.registration_standing,
  p_registration_authority text,
  p_registration_number text,
  p_tax_identification text,
  p_main_offerings text,
  p_activities text,
  p_regions_served text,
  p_operations_summary text,
  p_years_operating integer,
  p_applicant_position text,
  p_authorised boolean,
  p_accuracy boolean,
  p_consent boolean,
  p_category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  owner uuid;
  business_id uuid;
  category_count integer;
begin
  if actor is null then
    raise exception 'authentication is required';
  end if;
  if p_display_name is null or char_length(trim(p_display_name)) < 2 or char_length(trim(p_display_name)) > 120 then
    raise exception 'business name is not valid';
  end if;
  if p_slug is null or char_length(p_slug) < 3 or char_length(p_slug) > 60 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'business slug is not valid';
  end if;
  if coalesce(array_length(p_category_ids, 1), 0) > 12 then
    raise exception 'too many categories';
  end if;

  select application.applicant_id, application.business_id
  into owner, business_id
  from public.business_applications as application
  where application.id = p_application_id
  for update;

  if owner is null or owner is distinct from actor then
    raise exception 'application was not found';
  end if;

  update public.businesses
  set display_name = trim(p_display_name),
      slug = p_slug
  where id = business_id
    and created_by = actor
    and approval_status = 'pending';
  if not found then
    raise exception 'application business is not yours';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_category_ids, array[]::uuid[])) as wanted (id)
    where not exists (
      select 1
      from public.categories as category
      where category.id = wanted.id
        and category.is_active
    )
  ) then
    raise exception 'a category is not active';
  end if;

  update public.business_applications
  set status = p_status,
      business_kind = p_business_kind,
      description = coalesce(p_description, ''),
      country_code = nullif(p_country_code, ''),
      district = nullif(p_district, ''),
      city = nullif(p_city, ''),
      address = nullif(p_address, ''),
      website = nullif(p_website, ''),
      business_email = nullif(p_business_email, ''),
      business_phone = nullif(p_business_phone, ''),
      whatsapp_phone = nullif(p_whatsapp_phone, ''),
      registration_standing = p_registration_standing,
      registration_authority = nullif(p_registration_authority, ''),
      registration_number = nullif(p_registration_number, ''),
      tax_identification = nullif(p_tax_identification, ''),
      main_offerings = nullif(p_main_offerings, ''),
      activities = nullif(p_activities, ''),
      regions_served = nullif(p_regions_served, ''),
      operations_summary = nullif(p_operations_summary, ''),
      years_operating = p_years_operating,
      applicant_position = nullif(p_applicant_position, ''),
      authorised_declaration = coalesce(p_authorised, false),
      accuracy_declaration = coalesce(p_accuracy, false),
      verification_consent = coalesce(p_consent, false)
  where id = p_application_id;

  delete from public.business_application_categories
  where application_id = p_application_id;

  insert into public.business_application_categories (application_id, category_id)
  select distinct p_application_id, wanted.id
  from unnest(coalesce(p_category_ids, array[]::uuid[])) as wanted (id);

  get diagnostics category_count = row_count;
  if category_count is distinct from (
    select count(distinct wanted.id)
    from unnest(coalesce(p_category_ids, array[]::uuid[])) as wanted (id)
  ) then
    raise exception 'a category is not active';
  end if;
end;
$$;

create or replace function private.withdraw_business_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  owner uuid;
begin
  if actor is null then
    raise exception 'authentication is required';
  end if;

  select applicant_id
  into owner
  from public.business_applications
  where id = p_application_id
  for update;

  if owner is null or owner is distinct from actor then
    raise exception 'application was not found';
  end if;

  update public.business_applications
  set status = 'withdrawn'
  where id = p_application_id;
end;
$$;

create or replace function private.decide_business_application(
  p_application_id uuid,
  p_status public.application_status,
  p_message text,
  p_internal_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  owner uuid;
  current_status public.application_status;
begin
  if actor is null then
    raise exception 'authentication is required';
  end if;
  if not exists (
    select 1
    from public.user_roles
    where user_id = actor
      and role in ('reviewer', 'admin')
  ) then
    raise exception 'reviewer role is required';
  end if;
  if p_status not in ('under_review', 'information_requested', 'approved', 'rejected') then
    raise exception 'that status change is not available';
  end if;

  select applicant_id, status
  into owner, current_status
  from public.business_applications
  where id = p_application_id
  for update;

  if owner is null then
    raise exception 'application was not found';
  end if;
  if owner = actor then
    raise exception 'you cannot decide your own application';
  end if;
  if current_status is not distinct from p_status then
    raise exception 'that status change is not available';
  end if;

  if nullif(trim(coalesce(p_internal_note, '')), '') is not null then
    insert into public.business_application_internal_notes (application_id, author_id, body)
    values (p_application_id, actor, trim(p_internal_note));
  end if;

  update public.business_applications
  set status = p_status,
      applicant_visible_message = nullif(trim(coalesce(p_message, '')), '')
  where id = p_application_id;
end;
$$;

revoke all on function private.start_business_application(text) from public, anon, authenticated;
revoke all on function private.save_business_application(uuid, text, text, public.application_status, public.business_kind, text, text, text, text, text, text, text, text, text, public.registration_standing, text, text, text, text, text, text, text, integer, text, boolean, boolean, boolean, uuid[]) from public, anon, authenticated;
revoke all on function private.withdraw_business_application(uuid) from public, anon, authenticated;
revoke all on function private.decide_business_application(uuid, public.application_status, text, text) from public, anon, authenticated;

-- Invoker wrappers run as authenticated and must be able to resolve private functions.
-- Execute stays limited to the functions granted below. The API does not expose the private schema.
grant usage on schema private to authenticated;

grant execute on function private.start_business_application(text) to authenticated;
grant execute on function private.save_business_application(uuid, text, text, public.application_status, public.business_kind, text, text, text, text, text, text, text, text, text, public.registration_standing, text, text, text, text, text, text, text, integer, text, boolean, boolean, boolean, uuid[]) to authenticated;
grant execute on function private.withdraw_business_application(uuid) to authenticated;
grant execute on function private.decide_business_application(uuid, public.application_status, text, text) to authenticated;

create or replace function public.start_business_application(p_slug text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.start_business_application(p_slug);
end;
$$;

create or replace function public.save_business_application(
  p_application_id uuid,
  p_display_name text,
  p_slug text,
  p_status public.application_status,
  p_business_kind public.business_kind,
  p_description text,
  p_country_code text,
  p_district text,
  p_city text,
  p_address text,
  p_website text,
  p_business_email text,
  p_business_phone text,
  p_whatsapp_phone text,
  p_registration_standing public.registration_standing,
  p_registration_authority text,
  p_registration_number text,
  p_tax_identification text,
  p_main_offerings text,
  p_activities text,
  p_regions_served text,
  p_operations_summary text,
  p_years_operating integer,
  p_applicant_position text,
  p_authorised boolean,
  p_accuracy boolean,
  p_consent boolean,
  p_category_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.save_business_application(
    p_application_id,
    p_display_name,
    p_slug,
    p_status,
    p_business_kind,
    p_description,
    p_country_code,
    p_district,
    p_city,
    p_address,
    p_website,
    p_business_email,
    p_business_phone,
    p_whatsapp_phone,
    p_registration_standing,
    p_registration_authority,
    p_registration_number,
    p_tax_identification,
    p_main_offerings,
    p_activities,
    p_regions_served,
    p_operations_summary,
    p_years_operating,
    p_applicant_position,
    p_authorised,
    p_accuracy,
    p_consent,
    p_category_ids
  );
end;
$$;

create or replace function public.withdraw_business_application(p_application_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.withdraw_business_application(p_application_id);
end;
$$;

create or replace function public.decide_business_application(
  p_application_id uuid,
  p_status public.application_status,
  p_message text,
  p_internal_note text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.decide_business_application(p_application_id, p_status, p_message, p_internal_note);
end;
$$;

revoke all on function public.start_business_application(text) from public, anon;
revoke all on function public.save_business_application(uuid, text, text, public.application_status, public.business_kind, text, text, text, text, text, text, text, text, text, public.registration_standing, text, text, text, text, text, text, text, integer, text, boolean, boolean, boolean, uuid[]) from public, anon;
revoke all on function public.withdraw_business_application(uuid) from public, anon;
revoke all on function public.decide_business_application(uuid, public.application_status, text, text) from public, anon;

grant execute on function public.start_business_application(text) to authenticated;
grant execute on function public.save_business_application(uuid, text, text, public.application_status, public.business_kind, text, text, text, text, text, text, text, text, text, public.registration_standing, text, text, text, text, text, text, text, integer, text, boolean, boolean, boolean, uuid[]) to authenticated;
grant execute on function public.withdraw_business_application(uuid) to authenticated;
grant execute on function public.decide_business_application(uuid, public.application_status, text, text) to authenticated;

revoke insert, update, delete on table public.businesses from authenticated;
revoke insert, update, delete on table public.business_applications from authenticated;
revoke insert, update, delete on table public.business_application_categories from authenticated;
revoke insert, update, delete on table public.business_members from authenticated;
revoke insert, update, delete on table public.business_application_events from authenticated;
revoke insert, update, delete on table public.business_application_internal_notes from authenticated;

comment on function public.start_business_application(text) is
  'Creates a pending business, owner membership, draft application, and created event in one transaction.';
comment on function public.save_business_application(uuid, text, text, public.application_status, public.business_kind, text, text, text, text, text, text, text, text, text, public.registration_standing, text, text, text, text, text, text, text, integer, text, boolean, boolean, boolean, uuid[]) is
  'Saves an owned application, its business name, and its categories in one transaction.';
comment on function public.decide_business_application(uuid, public.application_status, text, text) is
  'Records a reviewer decision, optional internal note, and status change in one transaction. Does not publish products.';
