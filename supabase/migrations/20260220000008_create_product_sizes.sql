-- Size variants for products.
-- A product can have zero or more sizes (e.g. S, M, L, XL or 10cm, 20cm, etc.)

create table public.product_sizes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  label_en    text not null,
  label_el    text not null,
  sku_suffix  text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.product_sizes enable row level security;

create policy "Sizes are publicly readable"
  on public.product_sizes for select
  using (true);

create policy "Admins can insert sizes"
  on public.product_sizes for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update sizes"
  on public.product_sizes for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete sizes"
  on public.product_sizes for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index idx_product_sizes_product_id on public.product_sizes(product_id);
create index idx_product_sizes_sort_order on public.product_sizes(product_id, sort_order);
