-- Create orders table to track enquiries as orders linked to customers
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  enquiry_id      uuid references public.enquiries(id) on delete set null,
  order_number    serial not null unique,
  items           jsonb not null default '[]',
  total_amount    numeric(10, 2) not null default 0,
  status          text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Customers can read their own orders
create policy "Customers can read own orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.customers
      where customers.id = orders.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

-- Customers can insert orders (submit enquiry creates order)
create policy "Customers can insert own orders"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.customers
      where customers.id = orders.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

-- Admins can read all orders
create policy "Admins can read all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update orders
create policy "Admins can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index idx_orders_customer_id on public.orders(customer_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);

-- Add customer_id to enquiries to link them
alter table public.enquiries
  add column customer_id uuid references public.customers(id) on delete set null;

create index idx_enquiries_customer_id on public.enquiries(customer_id);

-- Trigger for updated_at
create or replace function public.handle_order_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_order_updated
  before update on public.orders
  for each row execute procedure public.handle_order_updated_at();
