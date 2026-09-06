-- Incremental upgrade for installations that already ran 202609060001_orders.sql.
alter table public.orders add column if not exists tax numeric(10,2) not null default 0 check (tax >= 0);

create or replace function public.sales_tax_rate()
returns numeric language sql immutable as $$ select 0.0975::numeric $$;

create or replace function public.create_order(
  p_order_type public.order_type, p_table_token uuid, p_customer_name text,
  p_customer_phone text, p_items jsonb, p_notes text default null, p_tip numeric default 0
) returns jsonb language plpgsql security definer set search_path = public as $$
declare new_order public.orders; row jsonb; v_item_slug text; unit_price numeric; quantity integer;
  subtotal numeric := 0; tax_value numeric := 0; surcharge_value numeric := case when p_order_type = 'pickup' then 0.50 else 0 end;
  table_uuid uuid; normalized_phone text := regexp_replace(trim(p_customer_phone), '[^0-9+]', '', 'g');
begin
  if p_order_type = 'dine_in' then
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

create or replace function public.update_my_order(p_order_id uuid, p_phone text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders; row jsonb; v_item_slug text; unit_price numeric; quantity integer; new_subtotal numeric := 0; new_tax numeric := 0;
begin
  select * into o from public.orders as ord where ord.id = p_order_id and ord.customer_phone = regexp_replace(trim(p_phone), '[^0-9+]', '', 'g') for update;
  if o.id is null or o.status <> 'nuevo' then raise exception 'Order cannot be edited'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Order must contain items'; end if;
  for row in select value from jsonb_array_elements(p_items) loop
    v_item_slug := row->>'item_slug'; unit_price := (row->>'unit_price')::numeric; quantity := (row->>'quantity')::integer;
    if v_item_slug is null or quantity is null or quantity < 1 or unit_price is null or unit_price < 0 then raise exception 'Invalid order item'; end if;
    if exists (select 1 from public.menu_item_status as mis where mis.item_slug = v_item_slug and not mis.is_available) then raise exception 'An item is sold out'; end if;
    if o.order_type = 'pickup' and (v_item_slug like 'beers-%' or v_item_slug like 'margaritas-%' or v_item_slug like 'daiquiris-%' or v_item_slug like 'mixed-drinks-%' or v_item_slug like 'wines-%') then raise exception 'Alcohol is not available for pickup'; end if;
    new_subtotal := new_subtotal + unit_price * quantity;
  end loop;
  new_tax := round(new_subtotal * public.sales_tax_rate(), 2);
  delete from public.order_items as oi where oi.order_id = o.id;
  for row in select value from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, item_slug, item_name, variant, unit_price, quantity, item_total, notes)
    values (o.id, row->>'item_slug', row->>'item_name', row->>'variant', (row->>'unit_price')::numeric, (row->>'quantity')::integer, (row->>'unit_price')::numeric * (row->>'quantity')::integer, row->>'notes');
  end loop;
  update public.orders as ord set subtotal = new_subtotal, tax = new_tax, total = new_subtotal + new_tax + o.surcharge + o.tip where ord.id = o.id returning * into o;
  return jsonb_build_object('order', to_jsonb(o), 'items', (select jsonb_agg(to_jsonb(oi)) from public.order_items as oi where oi.order_id = o.id));
end;
$$;
