-- Phase 04.1 guards. Does not replace catalogue policies and does not publish products.
-- Apply after 20261119113107_identity_and_applications.sql. Not applied in this phase.

alter type public.application_event add value if not exists 'created';

create or replace function private.reject_history_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'application history cannot be changed';
end;
$$;

revoke all on function private.reject_history_change() from public, anon, authenticated;

create trigger business_application_events_immutable
before update or delete on public.business_application_events
for each row
execute function private.reject_history_change();

create trigger business_application_notes_immutable
before update or delete on public.business_application_internal_notes
for each row
execute function private.reject_history_change();

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

  if old.applicant_id = actor then
    reviewer := false;
  end if;

  if reviewer then
    new.business_kind := old.business_kind;
    new.description := old.description;
    new.country_code := old.country_code;
    new.district := old.district;
    new.city := old.city;
    new.address := old.address;
    new.website := old.website;
    new.business_email := old.business_email;
    new.business_phone := old.business_phone;
    new.whatsapp_phone := old.whatsapp_phone;
    new.registration_standing := old.registration_standing;
    new.registration_authority := old.registration_authority;
    new.registration_number := old.registration_number;
    new.tax_identification := old.tax_identification;
    new.main_offerings := old.main_offerings;
    new.activities := old.activities;
    new.regions_served := old.regions_served;
    new.operations_summary := old.operations_summary;
    new.years_operating := old.years_operating;
    new.applicant_position := old.applicant_position;
    new.authorised_declaration := old.authorised_declaration;
    new.accuracy_declaration := old.accuracy_declaration;
    new.verification_consent := old.verification_consent;
    new.submitted_at := old.submitted_at;
  else
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

  if old.applicant_id = actor then
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

create table public.business_document_orphans (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  application_id uuid,
  reported_by uuid not null references auth.users (id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint orphan_path_length check (char_length(storage_path) between 1 and 400),
  constraint orphan_reason_length check (char_length(reason) between 1 and 300)
);

comment on table public.business_document_orphans is
  'Storage objects whose document row was not saved and whose removal also failed. Reviewers can read this recovery list.';

alter table public.business_document_orphans enable row level security;

revoke all on table public.business_document_orphans from public, anon, authenticated;
grant insert (storage_path, application_id, reported_by, reason) on public.business_document_orphans to authenticated;
grant select on public.business_document_orphans to authenticated;

create policy "Reporters record their own document orphan"
on public.business_document_orphans
for insert
to authenticated
with check (reported_by = (select auth.uid()));

create policy "Reporters read their own document orphans"
on public.business_document_orphans
for select
to authenticated
using (reported_by = (select auth.uid()));

create policy "Reviewers read document orphans"
on public.business_document_orphans
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('reviewer', 'admin')
  )
);

alter table public.business_application_documents
  add constraint documents_path_safe check (
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png|webp)$'
  );
