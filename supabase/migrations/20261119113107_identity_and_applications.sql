-- Phase 04 identity, applications, membership, and review.
-- Catalogue policies from 20261119095711_catalogue_foundation.sql are not replaced.
-- Approving a business does not publish its products.

create type public.platform_role as enum ('customer', 'business_owner', 'reviewer', 'admin');
create type public.business_kind as enum (
  'producer',
  'manufacturer',
  'supplier',
  'distributor',
  'retailer',
  'service_provider'
);
create type public.application_status as enum (
  'draft',
  'submitted',
  'under_review',
  'information_requested',
  'approved',
  'rejected',
  'withdrawn'
);
create type public.registration_standing as enum ('registered', 'not_registered', 'pending', 'not_required');
create type public.membership_role as enum ('owner', 'representative');
create type public.application_event as enum (
  'submitted',
  'under_review',
  'information_requested',
  'resubmitted',
  'approved',
  'rejected',
  'withdrawn'
);

alter table public.businesses
  add column created_by uuid references auth.users (id) on delete restrict;

comment on column public.businesses.created_by is
  'Auth user who created this business record. Null on rows that existed before Phase 04. Not part of the public catalogue.';

-- A table-level select grant covers every column, including ones added later.
-- Replace it with the public columns so created_by cannot be read by the API.
revoke select on table public.businesses from anon, authenticated;
grant select (id, display_name, slug, approval_status, created_at, updated_at)
  on table public.businesses to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  country_code text,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) between 2 and 120),
  constraint profiles_phone_length check (phone is null or char_length(phone) between 6 and 20),
  constraint profiles_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.platform_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is
  'Authorisation roles. Users can read their own rows and cannot insert, update, or delete them. reviewer and admin are granted by an operator.';

create table public.business_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete restrict,
  business_id uuid not null unique references public.businesses (id) on delete restrict,
  status public.application_status not null default 'draft',
  business_kind public.business_kind not null,
  description text not null default '',
  country_code text,
  district text,
  city text,
  address text,
  website text,
  business_email text,
  business_phone text,
  whatsapp_phone text,
  registration_standing public.registration_standing not null default 'not_required',
  registration_authority text,
  registration_number text,
  tax_identification text,
  main_offerings text,
  activities text,
  regions_served text,
  operations_summary text,
  years_operating integer,
  applicant_position text,
  authorised_declaration boolean not null default false,
  accuracy_declaration boolean not null default false,
  verification_consent boolean not null default false,
  applicant_visible_message text,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_description_length check (char_length(description) <= 2000),
  constraint applications_country_code check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint applications_years check (years_operating is null or years_operating between 0 and 200),
  constraint applications_email check (
    business_email is null or business_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint applications_message_length check (
    applicant_visible_message is null or char_length(applicant_visible_message) <= 2000
  )
);

create index business_applications_applicant_idx on public.business_applications (applicant_id, status);
create index business_applications_status_idx on public.business_applications (status, submitted_at);

create trigger business_applications_set_updated_at
before update on public.business_applications
for each row
execute function private.set_updated_at();

create table public.business_application_categories (
  application_id uuid not null references public.business_applications (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  primary key (application_id, category_id)
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_role public.membership_role not null,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index business_members_user_idx on public.business_members (user_id);

create table public.business_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.business_applications (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  uploaded_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint documents_mime check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  constraint documents_size check (size_bytes > 0 and size_bytes <= 10485760),
  constraint documents_name_length check (char_length(file_name) between 1 and 180),
  constraint documents_path_length check (char_length(storage_path) between 1 and 400)
);

create index business_application_documents_application_idx
  on public.business_application_documents (application_id);

create table public.business_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.business_applications (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  event public.application_event not null,
  from_status public.application_status,
  to_status public.application_status not null,
  applicant_message text,
  created_at timestamptz not null default now(),
  constraint events_message_length check (applicant_message is null or char_length(applicant_message) <= 2000)
);

create index business_application_events_application_idx
  on public.business_application_events (application_id, created_at);

create table public.business_application_internal_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.business_applications (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  constraint internal_notes_length check (char_length(body) between 1 and 2000)
);

create index business_application_internal_notes_application_idx
  on public.business_application_internal_notes (application_id, created_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-documents',
  'business-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  given_name text;
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_accepted', '') is distinct from 'true' then
    raise exception 'terms must be accepted';
  end if;

  given_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if given_name is null or char_length(given_name) < 2 then
    raise exception 'full name is required';
  end if;

  insert into public.profiles (id, full_name, terms_accepted_at)
  values (new.id, left(given_name, 120), now());

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

create or replace function private.enforce_application_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  reviewer boolean;
begin
  if actor is null then
    raise exception 'authentication is required';
  end if;

  reviewer := exists (
    select 1
    from public.user_roles
    where user_id = actor
      and role in ('reviewer', 'admin')
  );

  if tg_op = 'INSERT' then
    if new.applicant_id is distinct from actor or new.status <> 'draft' then
      raise exception 'applications start as your own draft';
    end if;
    if not exists (
      select 1
      from public.businesses
      where id = new.business_id
        and created_by = actor
        and approval_status = 'pending'
    ) then
      raise exception 'application business is not yours';
    end if;
    new.applicant_visible_message := null;
    new.decided_at := null;
    new.submitted_at := null;
    return new;
  end if;

  if new.applicant_id is distinct from old.applicant_id or new.business_id is distinct from old.business_id then
    raise exception 'application identity cannot change';
  end if;

  if not reviewer then
    new.applicant_visible_message := null;
    new.decided_at := old.decided_at;
    if new.status is not distinct from old.status then
      new.submitted_at := old.submitted_at;
    end if;
  end if;

  if new.status is not distinct from old.status then
    if reviewer then
      return new;
    end if;
    if old.applicant_id = actor and old.status in ('draft', 'information_requested') then
      return new;
    end if;
    raise exception 'this application cannot be edited';
  end if;

  if not reviewer and old.applicant_id = actor then
    if not (
      (old.status = 'draft' and new.status = 'submitted')
      or (old.status = 'information_requested' and new.status = 'submitted')
      or (old.status in ('draft', 'submitted', 'information_requested') and new.status = 'withdrawn')
    ) then
      raise exception 'that status change is not available';
    end if;
    if new.status = 'submitted' then
      if not (new.authorised_declaration and new.accuracy_declaration and new.verification_consent) then
        raise exception 'declarations are required before submission';
      end if;
      if char_length(trim(new.description)) < 10
        or new.business_email is null
        or new.business_phone is null
        or new.applicant_position is null
        or char_length(trim(new.applicant_position)) < 2
      then
        raise exception 'the application is incomplete';
      end if;
      if old.submitted_at is null then
        new.submitted_at := now();
      end if;
    end if;
    return new;
  end if;

  if reviewer and (
    (old.status = 'submitted' and new.status in ('under_review', 'information_requested', 'approved', 'rejected'))
    or (old.status = 'under_review' and new.status in ('information_requested', 'approved', 'rejected'))
  ) then
    if new.status in ('approved', 'rejected') then
      new.decided_at := now();
    end if;
    return new;
  end if;

  raise exception 'that status change is not available';
end;
$$;

revoke all on function private.enforce_application_change() from public, anon, authenticated;

create trigger business_applications_enforce_change
before insert or update on public.business_applications
for each row
execute function private.enforce_application_change();

create or replace function private.record_application_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_name public.application_event;
begin
  if tg_op <> 'UPDATE' or new.status is not distinct from old.status then
    return new;
  end if;

  event_name := case
    when old.status = 'information_requested' and new.status = 'submitted' then 'resubmitted'::public.application_event
    when new.status = 'submitted' then 'submitted'::public.application_event
    when new.status = 'under_review' then 'under_review'::public.application_event
    when new.status = 'information_requested' then 'information_requested'::public.application_event
    when new.status = 'approved' then 'approved'::public.application_event
    when new.status = 'rejected' then 'rejected'::public.application_event
    else 'withdrawn'::public.application_event
  end;

  insert into public.business_application_events (
    application_id,
    actor_id,
    event,
    from_status,
    to_status,
    applicant_message
  )
  values (
    new.id,
    auth.uid(),
    event_name,
    old.status,
    new.status,
    nullif(new.applicant_visible_message, '')
  );

  if new.status = 'approved' then
    update public.businesses
    set approval_status = 'approved'
    where id = new.business_id
      and approval_status = 'pending';

    insert into public.business_members (business_id, user_id, member_role)
    values (new.business_id, new.applicant_id, 'owner')
    on conflict (business_id, user_id) do nothing;

    insert into public.user_roles (user_id, role)
    values (new.applicant_id, 'business_owner')
    on conflict (user_id, role) do nothing;
  elsif new.status = 'rejected' then
    update public.businesses
    set approval_status = 'rejected'
    where id = new.business_id
      and approval_status = 'pending';
  end if;

  if new.applicant_visible_message is not null then
    update public.business_applications
    set applicant_visible_message = null
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function private.record_application_change() from public, anon, authenticated;

create trigger business_applications_record_change
after update on public.business_applications
for each row
execute function private.record_application_change();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.business_applications enable row level security;
alter table public.business_application_categories enable row level security;
alter table public.business_members enable row level security;
alter table public.business_application_documents enable row level security;
alter table public.business_application_events enable row level security;
alter table public.business_application_internal_notes enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.user_roles from public, anon, authenticated;
revoke all on table public.business_applications from public, anon, authenticated;
revoke all on table public.business_application_categories from public, anon, authenticated;
revoke all on table public.business_members from public, anon, authenticated;
revoke all on table public.business_application_documents from public, anon, authenticated;
revoke all on table public.business_application_events from public, anon, authenticated;
revoke all on table public.business_application_internal_notes from public, anon, authenticated;

grant select (
  id,
  full_name,
  phone,
  country_code,
  terms_accepted_at,
  created_at,
  updated_at
) on table public.profiles to authenticated;

grant update (full_name, phone, country_code) on table public.profiles to authenticated;

grant select on table public.user_roles to authenticated;

grant insert on table public.businesses to authenticated;
grant update (display_name, slug) on table public.businesses to authenticated;

grant select, insert, update on table public.business_applications to authenticated;
grant select, insert, delete on table public.business_application_categories to authenticated;
grant select on table public.business_members to authenticated;
grant select, insert, delete on table public.business_application_documents to authenticated;
grant select on table public.business_application_events to authenticated;
grant select, insert on table public.business_application_internal_notes to authenticated;

create policy "Users read their profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users update their profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Reviewers read applicant profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.business_applications as application
    join public.user_roles as role
      on role.user_id = (select auth.uid())
    where application.applicant_id = profiles.id
      and role.role in ('reviewer', 'admin')
  )
);

create policy "Users read their roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

create policy "Creators read their businesses"
on public.businesses
for select
to authenticated
using (created_by = auth.uid());

create policy "Applicants create pending businesses"
on public.businesses
for insert
to authenticated
with check (created_by = auth.uid() and approval_status = 'pending');

create policy "Reviewers read businesses with applications"
on public.businesses
for select
to authenticated
using (
  exists (
    select 1
    from public.business_applications as application
    join public.user_roles as role
      on role.user_id = (select auth.uid())
    where application.business_id = businesses.id
      and role.role in ('reviewer', 'admin')
  )
);

create policy "Creators rename pending businesses"
on public.businesses
for update
to authenticated
using (created_by = auth.uid() and approval_status = 'pending')
with check (created_by = auth.uid() and approval_status = 'pending');

create policy "Applicants and reviewers read applications"
on public.business_applications
for select
to authenticated
using (
  applicant_id = auth.uid()
  or exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('reviewer', 'admin')
  )
);

create policy "Applicants create drafts"
on public.business_applications
for insert
to authenticated
with check (applicant_id = auth.uid() and status = 'draft');

create policy "Applicants and reviewers update applications"
on public.business_applications
for update
to authenticated
using (
  applicant_id = auth.uid()
  or exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('reviewer', 'admin')
  )
)
with check (
  applicant_id = auth.uid()
  or exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('reviewer', 'admin')
  )
);

create policy "Application categories follow the application"
on public.business_application_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.business_applications
    where id = application_id
      and (
        applicant_id = auth.uid()
        or exists (
          select 1 from public.user_roles
          where user_id = auth.uid() and role in ('reviewer', 'admin')
        )
      )
  )
);

create policy "Applicants edit categories while the application is open"
on public.business_application_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.business_applications
    where id = application_id
      and applicant_id = auth.uid()
      and status in ('draft', 'information_requested')
  )
);

create policy "Applicants remove categories while the application is open"
on public.business_application_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.business_applications
    where id = application_id
      and applicant_id = auth.uid()
      and status in ('draft', 'information_requested')
  )
);

create policy "Members and reviewers read memberships"
on public.business_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('reviewer', 'admin')
  )
);

create policy "Applicants and reviewers read documents"
on public.business_application_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.business_applications
    where id = application_id
      and (
        applicant_id = auth.uid()
        or exists (
          select 1 from public.user_roles
          where user_id = auth.uid() and role in ('reviewer', 'admin')
        )
      )
  )
);

create policy "Applicants add documents while the application is open"
on public.business_application_documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.business_applications
    where id = application_id
      and applicant_id = auth.uid()
      and status in ('draft', 'information_requested')
  )
);

create policy "Applicants remove documents while the application is open"
on public.business_application_documents
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.business_applications
    where id = application_id
      and applicant_id = auth.uid()
      and status in ('draft', 'information_requested')
  )
);

create policy "Applicants and reviewers read application events"
on public.business_application_events
for select
to authenticated
using (
  exists (
    select 1
    from public.business_applications
    where id = application_id
      and (
        applicant_id = auth.uid()
        or exists (
          select 1 from public.user_roles
          where user_id = auth.uid() and role in ('reviewer', 'admin')
        )
      )
  )
);

create policy "Reviewers read internal notes"
on public.business_application_internal_notes
for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('reviewer', 'admin')
  )
);

create policy "Reviewers write internal notes"
on public.business_application_internal_notes
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('reviewer', 'admin')
  )
);

create policy "Applicants read their document files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'business-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.business_applications
    where id::text = (storage.foldername(name))[2]
      and applicant_id = auth.uid()
  )
);

create policy "Applicants upload document files while the application is open"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.business_applications
    where id::text = (storage.foldername(name))[2]
      and applicant_id = auth.uid()
      and status in ('draft', 'information_requested')
  )
);

create policy "Applicants delete document files while the application is open"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.business_applications
    where id::text = (storage.foldername(name))[2]
      and applicant_id = auth.uid()
      and status in ('draft', 'information_requested')
  )
);

create policy "Reviewers read application document files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'business-documents'
  and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('reviewer', 'admin')
  )
  and exists (
    select 1
    from public.business_application_documents
    where storage_path = name
  )
);
