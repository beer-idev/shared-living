create extension if not exists pgcrypto with schema extensions;

create type public.house_role as enum ('owner', 'member');
create type public.expense_category as enum ('electricity', 'water', 'internet', 'grocery', 'rent', 'other');
create type public.assignment_type as enum ('manual', 'random', 'rotation');
create type public.task_status as enum ('pending', 'completed');
create type public.reaction_type as enum ('looks_great', 'appreciate', 'thanks');
create type public.notification_type as enum ('expense', 'task', 'harmony', 'celebration', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_path text,
  task_reminders boolean not null default true,
  bill_alerts boolean not null default true,
  house_activity boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  currency text not null default 'THB' check (char_length(currency) = 3),
  harmony_score integer not null default 0 check (harmony_score between 0 and 100),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.house_members (
  house_id uuid not null references public.houses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.house_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (house_id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  description text,
  category public.expense_category not null,
  amount numeric(12,2) not null check (amount > 0),
  paid_by uuid not null references public.profiles(id),
  receipt_path text,
  expense_date date not null default current_date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null check (amount >= 0),
  is_paid boolean not null default false,
  paid_at timestamptz,
  unique (expense_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  description text,
  due_at timestamptz not null,
  assignment_type public.assignment_type not null,
  assigned_to uuid references public.profiles(id),
  status public.task_status not null default 'pending',
  completion_photo_path text,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.task_reactions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction public.reaction_type not null,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create table public.harmony_events (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  points integer not null check (points between -100 and 100),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.celebrations (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  details text,
  location text,
  starts_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index expenses_house_date_idx on public.expenses(house_id, expense_date desc);
create index splits_user_paid_idx on public.expense_splits(user_id, is_paid);
create index tasks_house_due_idx on public.tasks(house_id, due_at);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index harmony_events_house_idx on public.harmony_events(house_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger houses_updated_at before update on public.houses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_house_member(check_house_id uuid, check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.house_members
    where house_id = check_house_id and user_id = check_user_id
  );
$$;

create or replace function public.is_house_owner(check_house_id uuid, check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.house_members
    where house_id = check_house_id and user_id = check_user_id and role = 'owner'
  );
$$;

create or replace function public.create_house(house_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_house_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.houses (name, created_by) values (house_name, auth.uid()) returning id into new_house_id;
  insert into public.house_members (house_id, user_id, role) values (new_house_id, auth.uid(), 'owner');
  return new_house_id;
end;
$$;

create or replace function public.join_house_by_code(code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_house_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select id into target_house_id from public.houses where invite_code = upper(trim(code));
  if target_house_id is null then raise exception 'Invite code not found'; end if;
  insert into public.house_members (house_id, user_id, role)
  values (target_house_id, auth.uid(), 'member') on conflict do nothing;
  return target_house_id;
end;
$$;

create or replace function public.apply_harmony_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.houses
  set harmony_score = greatest(0, least(100, harmony_score + new.points))
  where id = new.house_id;
  return new;
end;
$$;

create trigger harmony_score_after_event after insert on public.harmony_events
for each row execute function public.apply_harmony_event();

create or replace function public.notify_new_expense()
returns trigger language plpgsql security definer set search_path = '' as $$
declare member_id uuid;
begin
  for member_id in
    select hm.user_id
    from public.house_members hm
    join public.profiles p on p.id = hm.user_id
    where hm.house_id = new.house_id and hm.user_id <> new.created_by and p.bill_alerts
  loop
    insert into public.notifications (user_id, house_id, type, title, body, href)
    values (member_id, new.house_id, 'expense', 'A new shared expense was added', new.title || ' · ' || new.amount::text, '/expenses/' || new.id::text);
  end loop;
  return new;
end;
$$;

create trigger notify_after_expense after insert on public.expenses
for each row execute function public.notify_new_expense();

create or replace function public.notify_new_task()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is not null and new.assigned_to <> new.created_by
    and exists (select 1 from public.profiles where id = new.assigned_to and task_reminders)
  then
    insert into public.notifications (user_id, house_id, type, title, body, href)
    values (new.assigned_to, new.house_id, 'task', 'A new chore was assigned to you', new.title, '/chores/' || new.id::text);
  end if;
  return new;
end;
$$;

create trigger notify_after_task after insert on public.tasks
for each row execute function public.notify_new_task();

create or replace function public.notify_new_celebration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare member_id uuid;
begin
  for member_id in
    select hm.user_id
    from public.house_members hm
    join public.profiles p on p.id = hm.user_id
    where hm.house_id = new.house_id and hm.user_id <> new.created_by and p.house_activity
  loop
    insert into public.notifications (user_id, house_id, type, title, body, href)
    values (member_id, new.house_id, 'celebration', 'A house celebration was planned', new.title, '/harmony');
  end loop;
  return new;
end;
$$;

create trigger notify_after_celebration after insert on public.celebrations
for each row execute function public.notify_new_celebration();

create or replace function public.complete_task(p_task_id uuid, p_photo_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_task public.tasks%rowtype;
declare member_id uuid;
begin
  select * into current_task from public.tasks where id = p_task_id for update;
  if current_task.id is null then raise exception 'Task not found'; end if;
  if not public.is_house_member(current_task.house_id) then raise exception 'Not a house member'; end if;
  if current_task.assigned_to is distinct from auth.uid() and not public.is_house_owner(current_task.house_id) then
    raise exception 'Only the assignee or owner can complete this task';
  end if;
  if current_task.status = 'completed' then raise exception 'Task is already complete'; end if;

  update public.tasks set status = 'completed', completion_photo_path = p_photo_path, completed_at = now()
  where id = p_task_id;
  insert into public.harmony_events (house_id, user_id, task_id, points, reason)
  values (current_task.house_id, coalesce(current_task.assigned_to, auth.uid()), p_task_id, 10, 'task_completed');

  for member_id in select user_id from public.house_members where house_id = current_task.house_id and user_id <> auth.uid()
  loop
    insert into public.notifications (user_id, house_id, type, title, body, href)
    values (member_id, current_task.house_id, 'task', current_task.title || ' completed', 'A housemate completed a chore. Send them some appreciation.', '/chores/' || p_task_id::text);
  end loop;
end;
$$;

create or replace function public.appreciate_task(p_task_id uuid, p_reaction public.reaction_type)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_task public.tasks%rowtype;
declare is_first boolean;
begin
  select * into current_task from public.tasks where id = p_task_id;
  if current_task.status <> 'completed' then raise exception 'Task is not complete'; end if;
  if not public.is_house_member(current_task.house_id) then raise exception 'Not a house member'; end if;
  if current_task.assigned_to = auth.uid() then raise exception 'You cannot react to your own task'; end if;

  is_first := not exists (select 1 from public.task_reactions where task_id = p_task_id);
  insert into public.task_reactions (task_id, user_id, reaction)
  values (p_task_id, auth.uid(), p_reaction)
  on conflict (task_id, user_id) do update set reaction = excluded.reaction;

  if is_first then
    insert into public.harmony_events (house_id, user_id, task_id, points, reason)
    values (current_task.house_id, current_task.assigned_to, p_task_id, 5, 'first_appreciation');
  end if;
  return is_first;
end;
$$;

alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.house_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.tasks enable row level security;
alter table public.task_reactions enable row level security;
alter table public.harmony_events enable row level security;
alter table public.celebrations enable row level security;
alter table public.notifications enable row level security;

create policy "profiles visible to shared housemates" on public.profiles for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.house_members mine join public.house_members theirs on mine.house_id = theirs.house_id
  where mine.user_id = auth.uid() and theirs.user_id = profiles.id
));
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members view houses" on public.houses for select to authenticated using (public.is_house_member(id));
create policy "authenticated create houses" on public.houses for insert to authenticated with check (created_by = auth.uid());
create policy "owners update houses" on public.houses for update to authenticated using (public.is_house_owner(id));

create policy "members view memberships" on public.house_members for select to authenticated using (public.is_house_member(house_id));
create policy "owners manage memberships" on public.house_members for all to authenticated using (public.is_house_owner(house_id)) with check (public.is_house_owner(house_id));

create policy "members view expenses" on public.expenses for select to authenticated using (public.is_house_member(house_id));
create policy "members create expenses" on public.expenses for insert to authenticated with check (public.is_house_member(house_id) and created_by = auth.uid());
create policy "creator or owner updates expenses" on public.expenses for update to authenticated using (created_by = auth.uid() or public.is_house_owner(house_id));
create policy "creator or owner deletes expenses" on public.expenses for delete to authenticated using (created_by = auth.uid() or public.is_house_owner(house_id));

create policy "members view splits" on public.expense_splits for select to authenticated using (
  exists (select 1 from public.expenses e where e.id = expense_id and public.is_house_member(e.house_id))
);
create policy "expense creators manage splits" on public.expense_splits for all to authenticated using (
  exists (select 1 from public.expenses e where e.id = expense_id and (e.created_by = auth.uid() or public.is_house_owner(e.house_id)))
) with check (
  exists (select 1 from public.expenses e where e.id = expense_id and (e.created_by = auth.uid() or public.is_house_owner(e.house_id)))
);
create policy "users pay own split" on public.expense_splits for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members view tasks" on public.tasks for select to authenticated using (public.is_house_member(house_id));
create policy "members create tasks" on public.tasks for insert to authenticated with check (public.is_house_member(house_id) and created_by = auth.uid());
create policy "assignee creator owner update tasks" on public.tasks for update to authenticated using (assigned_to = auth.uid() or created_by = auth.uid() or public.is_house_owner(house_id));
create policy "creator owner delete tasks" on public.tasks for delete to authenticated using (created_by = auth.uid() or public.is_house_owner(house_id));

create policy "members view reactions" on public.task_reactions for select to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_house_member(t.house_id))
);
create policy "members react" on public.task_reactions for insert to authenticated with check (user_id = auth.uid() and exists (
  select 1 from public.tasks t where t.id = task_id and public.is_house_member(t.house_id)
));
create policy "users change own reaction" on public.task_reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members view harmony" on public.harmony_events for select to authenticated using (public.is_house_member(house_id));
create policy "members view celebrations" on public.celebrations for select to authenticated using (public.is_house_member(house_id));
create policy "owners create celebrations" on public.celebrations for insert to authenticated with check (public.is_house_owner(house_id) and created_by = auth.uid());
create policy "owners update celebrations" on public.celebrations for update to authenticated using (public.is_house_owner(house_id));

create policy "users view own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-proofs', 'task-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expense-receipts', 'expense-receipts', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "house members upload task proofs" on storage.objects for insert to authenticated
with check (bucket_id = 'task-proofs' and public.is_house_member((storage.foldername(name))[1]::uuid));
create policy "house members view task proofs" on storage.objects for select to authenticated
using (bucket_id = 'task-proofs' and public.is_house_member((storage.foldername(name))[1]::uuid));
create policy "house members upload receipts" on storage.objects for insert to authenticated
with check (bucket_id = 'expense-receipts' and public.is_house_member((storage.foldername(name))[1]::uuid));
create policy "house members view receipts" on storage.objects for select to authenticated
using (bucket_id = 'expense-receipts' and public.is_house_member((storage.foldername(name))[1]::uuid));
create policy "house members update receipts" on storage.objects for update to authenticated
using (bucket_id = 'expense-receipts' and public.is_house_member((storage.foldername(name))[1]::uuid))
with check (bucket_id = 'expense-receipts' and public.is_house_member((storage.foldername(name))[1]::uuid));

grant execute on function public.create_house(text) to authenticated;
grant execute on function public.join_house_by_code(text) to authenticated;
grant execute on function public.complete_task(uuid, text) to authenticated;
grant execute on function public.appreciate_task(uuid, public.reaction_type) to authenticated;
