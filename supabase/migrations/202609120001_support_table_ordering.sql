-- Feature flag for the future table-ordering rollout. It defaults to off.
alter type public.user_role add value if not exists 'support';

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  table_ordering_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.app_settings (id, table_ordering_enabled)
values (true, false)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

create policy app_settings_public_read on public.app_settings
for select to anon, authenticated using (true);

-- Support may only change this one feature flag, never table records or other settings.
create or replace function public.set_table_ordering_enabled(p_enabled boolean)
returns public.app_settings
language plpgsql security definer set search_path = public as $$
declare result public.app_settings;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'support'
  ) then
    raise exception 'Only support users can change table ordering';
  end if;
  update public.app_settings
  set table_ordering_enabled = p_enabled, updated_at = now(), updated_by = auth.uid()
  where id = true
  returning * into result;
  return result;
end;
$$;

grant select on public.app_settings to anon, authenticated;
grant execute on function public.set_table_ordering_enabled(boolean) to authenticated;

-- Support is intentionally not staff: it cannot read or administer orders.
create or replace function public.is_staff(required_role public.user_role default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
      and (required_role is null or role = required_role)
  );
$$;

-- Enforce the flag server-side as well as in the UI.
create or replace function public.create_order(
  p_order_type public.order_type, p_table_token uuid, p_customer_name text,
  p_customer_phone text, p_items jsonb, p_notes text default null, p_tip numeric default 0
) returns jsonb language plpgsql security definer set search_path = public as $$
declare new_order public.orders; row jsonb; v_item_slug text; unit_price numeric; quantity integer;
  subtotal numeric := 0; tax_value numeric := 0; surcharge_value numeric := case when p_order_type = 'pickup' then 0.50 else 0 end;
  table_uuid uuid; normalized_phone text := regexp_replace(trim(p_customer_phone), '[^0-9+]', '', 'g');
begin
  if p_order_type = 'dine_in' then
    if not coalesce((select table_ordering_enabled from public.app_settings where id = true), false) then
      raise exception 'Table ordering is currently unavailable';
    end if;
    select t.id into table_uuid from public.tables as t where t.qr_token = p_table_token and t.active;
    if table_uuid is null then raise exception 'Invalid or inactive table QR'; end if;
  elsif p_table_token is not null then raise exception 'Pickup orders cannot include a table'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Order must contain items'; end if;
  if length(trim(p_customer_name)) = 0 or length(normalized_phone) < 7 then raise exception 'Customer name and phone are required'; end if;
  for row in select value from jsonb_array_elements(p_items) loop
    v_item_slug := row->>'item_slug'; unit_price := (row->>'unit_price')::numeric; quantity := (row->>'quantity')::integer;
    if v_item_slug is null or quantity is null or quantity < 1 or unit_price is null or unit_price < 0 then raise exception 'Invalid order item'; end if;
    if exists (select 1 from public.menu_item_status as mis where mis.item_slug = v_item_slug and not mis.is_available) then raise exception 'An item is sold out'; end if;
    if p_order_type = 'pickup' and (v_item_slug like 'beers-%' or v_item_slug like 'margaritas-%' or v_item_slug like 'daiquiris-%' or v_item_slug like 'mixed-drinks-%' or v_item_slug like 'wines-%') then raise exception 'Alcohol is not available for pickup'; end if;
    subtotal := subtotal + unit_price * quantity;
  end loop;
  tax_value := round(subtotal * public.sales_tax_rate(), 2);
  insert into public.orders(order_number, order_type, table_id, customer_name, customer_phone, notes, subtotal, tax, surcharge, tip, total)
  values ('#' || lpad(nextval('public.order_number_seq')::text, 4, '0'), p_order_type, table_uuid, trim(p_customer_name), normalized_phone, p_notes, subtotal, tax_value, surcharge_value, greatest(coalesce(p_tip, 0), 0), subtotal + tax_value + surcharge_value + greatest(coalesce(p_tip, 0), 0)) returning * into new_order;
  for row in select value from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, item_slug, item_name, variant, unit_price, quantity, item_total, notes)
    values (new_order.id, row->>'item_slug', row->>'item_name', row->>'variant', (row->>'unit_price')::numeric, (row->>'quantity')::integer, (row->>'unit_price')::numeric * (row->>'quantity')::integer, row->>'notes');
  end loop;
  return jsonb_build_object('order', to_jsonb(new_order), 'items', coalesce((select jsonb_agg(to_jsonb(oi)) from public.order_items as oi where oi.order_id = new_order.id), '[]'::jsonb));
end;
$$;

-- After creating the Auth user, assign its profile with:
-- update public.profiles set role = 'support' where id = '<auth-user-uuid>';
