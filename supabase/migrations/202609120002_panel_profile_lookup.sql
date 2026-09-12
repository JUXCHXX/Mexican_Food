-- Run after 202609120001_support_table_ordering.sql.
-- Lets the authenticated user read only their own panel identity.
create or replace function public.get_my_panel_profile()
returns table(role public.user_role, full_name text)
language sql stable security definer set search_path = public as $$
  select p.role, p.full_name
  from public.profiles as p
  where p.id = auth.uid()
$$;

grant execute on function public.get_my_panel_profile() to authenticated;

-- Diagnostic query for the SQL editor (replace the email before running):
-- select u.id, u.email, p.full_name, p.role
-- from auth.users as u
-- left join public.profiles as p on p.id = u.id
-- where u.email = 'support@example.com';
--
-- If role is null, use the id returned above:
-- update public.profiles set role = 'support' where id = '<auth.users.id>';
