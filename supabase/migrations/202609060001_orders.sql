-- Fabian's ordering system. Run this migration in the Supabase SQL editor.
create extension if not exists pgcrypto;

create type public.user_role as enum ('super_admin', 'admin');
create type public.order_type as enum ('dine_in', 'pickup');
create type public.order_status as enum ('nuevo', 'cocina', 'listo', 'entregado');

create sequence public.order_number_seq start 1;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number > 0),
  qr_token uuid not null unique default gen_random_uuid(),
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.menu_item_status (
  item_slug text primary key,
  is_available boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  order_type public.order_type not null,
  table_id uuid references public.tables(id) on delete set null,
  customer_name text not null check (length(trim(customer_name)) between 1 and 120),
  customer_phone text not null check (length(regexp_replace(customer_phone, '[^0-9+]', '', 'g')) >= 7),
  status public.order_status not null default 'nuevo',
  notes text,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  tax numeric(10,2) not null default 0 check (tax >= 0),
  surcharge numeric(10,2) not null default 0 check (surcharge >= 0),
  tip numeric(10,2) not null default 0 check (tip >= 0),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ready_at timestamptz,
  delivered_at timestamptz
);
create index orders_customer_phone_idx on public.orders(customer_phone);
create index orders_status_created_idx on public.orders(status, created_at desc);

-- Keep the rate in one database function so it can be changed without touching order logic.
create or replace function public.sales_tax_rate()
returns numeric language sql immutable as $$ select 0.0975::numeric $$;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_slug text not null,
  item_name text not null,
  variant text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  item_total numeric(10,2) not null check (item_total >= 0),
  notes text
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles(id) on delete set null
);
create index order_status_history_order_idx on public.order_status_history(order_id, changed_at);

create table public.order_ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff(required_role public.user_role default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (required_role is null or role = required_role)
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger orders_touch_updated_at before update on public.orders
for each row execute function public.touch_updated_at();
create trigger menu_status_touch_updated_at before update on public.menu_item_status
for each row execute function public.touch_updated_at();

create or replace function public.record_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history(order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;
create or replace function public.set_order_status_dates()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'listo' then new.ready_at = coalesce(new.ready_at, now()); end if;
    if new.status = 'entregado' then new.delivered_at = coalesce(new.delivered_at, now()); end if;
  end if;
  return new;
end;
$$;
create trigger orders_set_status_dates before update of status on public.orders
for each row execute function public.set_order_status_dates();
create trigger orders_record_status after insert or update of status on public.orders
for each row execute function public.record_order_status_change();

create or replace function public.create_order(
  p_order_type public.order_type,
  p_table_token uuid,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb,
  p_notes text default null,
  p_tip numeric default 0
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  new_order public.orders;
  row jsonb;
  v_item_slug text;
  item_name text;
  variant text;
  unit_price numeric;
  quantity integer;
  subtotal numeric := 0;
  tax_value numeric := 0;
  surcharge_value numeric := case when p_order_type = 'pickup' then 0.50 else 0 end;
  table_uuid uuid;
  normalized_phone text := regexp_replace(trim(p_customer_phone), '[^0-9+]', '', 'g');
begin
  if p_order_type = 'dine_in' then
    select id into table_uuid from public.tables where qr_token = p_table_token and active;
    if table_uuid is null then raise exception 'Invalid or inactive table QR'; end if;
  elsif p_table_token is not null then
    raise exception 'Pickup orders cannot include a table';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Order must contain items'; end if;
  if length(trim(p_customer_name)) = 0 or length(normalized_phone) < 7 then raise exception 'Customer name and phone are required'; end if;

  for row in select value from jsonb_array_elements(p_items) loop
    v_item_slug := row->>'item_slug'; item_name := row->>'item_name'; variant := row->>'variant';
    unit_price := (row->>'unit_price')::numeric; quantity := (row->>'quantity')::integer;
    if v_item_slug is null or quantity is null or quantity < 1 or unit_price is null or unit_price < 0 then raise exception 'Invalid order item'; end if;
    if exists (select 1 from public.menu_item_status as mis where mis.item_slug = v_item_slug and not mis.is_available) then raise exception 'An item is sold out'; end if;
    if p_order_type = 'pickup' and (v_item_slug like 'beers-%' or v_item_slug like 'margaritas-%' or v_item_slug like 'daiquiris-%' or v_item_slug like 'mixed-drinks-%' or v_item_slug like 'wines-%') then raise exception 'Alcohol is not available for pickup'; end if;
    subtotal := subtotal + unit_price * quantity;
  end loop;
  tax_value := round(subtotal * public.sales_tax_rate(), 2);

  insert into public.orders(order_number, order_type, table_id, customer_name, customer_phone, notes, subtotal, tax, surcharge, tip, total)
  values ('#' || lpad(nextval('public.order_number_seq')::text, 4, '0'), p_order_type, table_uuid, trim(p_customer_name), normalized_phone, p_notes, subtotal, tax_value, surcharge_value, greatest(coalesce(p_tip, 0), 0), subtotal + tax_value + surcharge_value + greatest(coalesce(p_tip, 0), 0))
  returning * into new_order;

  for row in select value from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, item_slug, item_name, variant, unit_price, quantity, item_total, notes)
    values (new_order.id, row->>'item_slug', row->>'item_name', row->>'variant', (row->>'unit_price')::numeric, (row->>'quantity')::integer, (row->>'unit_price')::numeric * (row->>'quantity')::integer, row->>'notes');
  end loop;
  return jsonb_build_object('order', to_jsonb(new_order), 'items', coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = new_order.id), '[]'::jsonb));
end;
$$;

create or replace function public.get_my_orders(p_phone text)
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('order', to_jsonb(o), 'items', coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = o.id), '[]'::jsonb), 'rating', (select to_jsonb(r) from public.order_ratings r where r.order_id = o.id)) order by o.created_at desc), '[]'::jsonb)
  from public.orders o where o.customer_phone = regexp_replace(trim(p_phone), '[^0-9+]', '', 'g');
$$;

create or replace function public.update_my_order(p_order_id uuid, p_phone text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders; row jsonb; new_subtotal numeric := 0; v_item_slug text; unit_price numeric; quantity integer; new_tax numeric := 0;
begin
  select * into o from public.orders where id = p_order_id and customer_phone = regexp_replace(trim(p_phone), '[^0-9+]', '', 'g') for update;
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
  delete from public.order_items where order_id = o.id;
  for row in select value from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, item_slug, item_name, variant, unit_price, quantity, item_total, notes) values (o.id, row->>'item_slug', row->>'item_name', row->>'variant', (row->>'unit_price')::numeric, (row->>'quantity')::integer, (row->>'unit_price')::numeric * (row->>'quantity')::integer, row->>'notes');
  end loop;
  update public.orders set subtotal = new_subtotal, tax = new_tax, total = new_subtotal + new_tax + surcharge + tip where id = o.id returning * into o;
  return jsonb_build_object('order', to_jsonb(o), 'items', (select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = o.id));
end;
$$;

create or replace function public.submit_rating(p_order_id uuid, p_phone text, p_rating integer, p_comment text default null)
returns public.order_ratings language plpgsql security definer set search_path = public as $$
declare result public.order_ratings;
begin
  if not exists (select 1 from public.orders where id = p_order_id and customer_phone = regexp_replace(trim(p_phone), '[^0-9+]', '', 'g') and status = 'entregado') then raise exception 'Only delivered orders can be rated'; end if;
  insert into public.order_ratings(order_id, rating, comment) values (p_order_id, p_rating, p_comment) on conflict (order_id) do update set rating = excluded.rating, comment = excluded.comment returning * into result;
  return result;
end;
$$;

alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.menu_item_status enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_ratings enable row level security;

create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff('super_admin'));
create policy profiles_super_update on public.profiles for update to authenticated using (public.is_staff('super_admin')) with check (public.is_staff('super_admin'));
create policy tables_public_active on public.tables for select to anon, authenticated using (active or public.is_staff('super_admin'));
create policy tables_super_write on public.tables for all to authenticated using (public.is_staff('super_admin')) with check (public.is_staff('super_admin'));
create policy menu_status_public_read on public.menu_item_status for select to anon, authenticated using (true);
create policy menu_status_super_write on public.menu_item_status for all to authenticated using (public.is_staff('super_admin')) with check (public.is_staff('super_admin'));
create policy orders_staff_all on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy order_items_staff_all on public.order_items for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy order_history_staff_all on public.order_status_history for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy ratings_staff_all on public.order_ratings for all to authenticated using (public.is_staff()) with check (public.is_staff());

revoke all on public.orders, public.order_items, public.order_status_history, public.order_ratings from anon, authenticated;
grant execute on function public.create_order(public.order_type, uuid, text, text, jsonb, text, numeric) to anon, authenticated;
grant execute on function public.get_my_orders(text) to anon, authenticated;
grant execute on function public.update_my_order(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.submit_rating(uuid, text, integer, text) to anon, authenticated;
grant select on public.tables, public.menu_item_status to anon, authenticated;
grant select, update, insert, delete on public.orders, public.order_items, public.order_status_history, public.order_ratings to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.menu_item_status;
exception when duplicate_object then null;
end $$;
