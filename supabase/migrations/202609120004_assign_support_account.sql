-- Replace the email, then run this in Supabase SQL Editor.
-- It creates the profile if missing and always assigns the correct Auth user the support role.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), 'Support'),
  'support'::public.user_role
from auth.users as u
where lower(u.email) = lower('support@example.com')
on conflict (id) do update
set role = excluded.role;

-- Verify the result. It must return role = support.
select u.id, u.email, p.full_name, p.role
from auth.users as u
join public.profiles as p on p.id = u.id
where lower(u.email) = lower('support@example.com');
