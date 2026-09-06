create or replace function public.get_my_orders(p_phone text)
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'order', to_jsonb(o) || jsonb_build_object('table_number', (select t.number from public.tables as t where t.id = o.table_id)),
    'items', coalesce((select jsonb_agg(to_jsonb(oi)) from public.order_items as oi where oi.order_id = o.id), '[]'::jsonb),
    'rating', (select to_jsonb(r) from public.order_ratings as r where r.order_id = o.id)
  ) order by o.created_at desc), '[]'::jsonb)
  from public.orders as o where o.customer_phone = regexp_replace(trim(p_phone), '[^0-9+]', '', 'g');
$$;
