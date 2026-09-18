-- Add the terminal status used when staff rejects an order.
alter type public.order_status add value if not exists 'rechazado';

create or replace function public.delete_order_history(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  ) then
    raise exception 'Only super admins can delete order history';
  end if;

  with deleted as (
    delete from public.orders
    where status in ('entregado', 'rechazado')
      and (p_start is null or created_at >= p_start)
      and (p_end is null or created_at < p_end)
    returning id
  )
  select count(*) into deleted_count from deleted;
  return deleted_count;
end;
$$;

grant execute on function public.delete_order_history(timestamptz, timestamptz)
to authenticated;