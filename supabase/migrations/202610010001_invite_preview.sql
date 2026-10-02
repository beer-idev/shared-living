create or replace function public.get_house_invite_preview(code text)
returns table (name text, member_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select h.name, count(hm.user_id)
  from public.houses h
  left join public.house_members hm on hm.house_id = h.id
  where h.invite_code = upper(trim(code))
  group by h.id, h.name;
$$;

revoke all on function public.get_house_invite_preview(text) from public;
grant execute on function public.get_house_invite_preview(text) to anon, authenticated;
