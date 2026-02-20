create table public.products (
  id              uuid primary key default gen_random_uuid(),
  sku             text not null unique,
  name_en         text not null,
  name_el         text not null,
  description_en  text,
  description_el  text,
  price           numeric(10, 2) not null,
  moq             integer not null default 1,
  category_id     uuid references public.categories(id) on delete set null,
  tags            text[] not null default '{}',
  is_featured     boolean not null default false,
  is_new_arrival  boolean not null default false,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public reads only active products
create policy "Active products are publicly readable"
  on public.products for select
  using (is_active = true);

-- Admins can read all products (including inactive)
create policy "Admins can read all products"
  on public.products for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert/update/delete
create policy "Admins can insert products"
  on public.products for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update products"
  on public.products for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete products"
  on public.products for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index idx_products_category_id on public.products(category_id);
create index idx_products_sku on public.products(sku);
create index idx_products_is_active on public.products(is_active);
create index idx_products_is_featured on public.products(is_featured) where is_featured = true;
create index idx_products_is_new_arrival on public.products(is_new_arrival) where is_new_arrival = true;
create index idx_products_tags on public.products using gin(tags);
create index idx_products_sort_order on public.products(sort_order);

-- Full-text search index across both languages, SKU and description
create index idx_products_fts on public.products using gin(
  to_tsvector('simple',
    coalesce(name_en, '') || ' ' ||
    coalesce(name_el, '') || ' ' ||
    coalesce(sku, '') || ' ' ||
    coalesce(description_en, '') || ' ' ||
    coalesce(description_el, '')
  )
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
