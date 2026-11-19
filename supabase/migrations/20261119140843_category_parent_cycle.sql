-- Reject category parent cycles longer than the existing self-parent check.
-- The catalogue migration is already applied remotely, so this is a new migration.
-- Also pin the updated-at trigger function search path.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create or replace function private.reject_category_cycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  seen uuid[] := array[new.id];
  current_id uuid := new.parent_id;
begin
  if current_id is null then
    return new;
  end if;

  while current_id is not null loop
    if current_id = any (seen) then
      raise exception 'category parent would create a cycle';
    end if;
    seen := seen || current_id;
    select parent_id
    into current_id
    from public.categories
    where id = current_id;
  end loop;

  return new;
end;
$$;

revoke all on function private.reject_category_cycle() from public, anon, authenticated;

create trigger categories_reject_cycle
before insert or update of parent_id on public.categories
for each row
execute function private.reject_category_cycle();
