create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_en       text,
  alt_el       text,
  sort_order   integer not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.product_images enable row level security;

create policy "Product images are publicly readable"
  on public.product_images for select
  using (true);

create policy "Admins can insert product images"
  on public.product_images for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update product images"
  on public.product_images for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete product images"
  on public.product_images for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index idx_product_images_product_id on public.product_images(product_id);
create index idx_product_images_sort_order on public.product_images(product_id, sort_order);
create index idx_product_images_primary on public.product_images(product_id, is_primary)
  where is_primary = true;
