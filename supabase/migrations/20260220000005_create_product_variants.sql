-- Color variants for products.
-- variant_type = 'swatch': just a color name + hex, no separate image
-- variant_type = 'image':  has its own images in variant_images table

create table public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  sku_suffix    text,
  color_name_en text not null,
  color_name_el text not null,
  hex_color     text,
  variant_type  text not null default 'swatch'
    check (variant_type in ('swatch', 'image')),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table public.variant_images (
  id           uuid primary key default gen_random_uuid(),
  variant_id   uuid not null references public.product_variants(id) on delete cascade,
  storage_path text not null,
  alt_en       text,
  alt_el       text,
  sort_order   integer not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.product_variants enable row level security;
alter table public.variant_images enable row level security;

create policy "Variants are publicly readable"
  on public.product_variants for select
  using (true);

create policy "Admins can insert variants"
  on public.product_variants for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update variants"
  on public.product_variants for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete variants"
  on public.product_variants for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Variant images are publicly readable"
  on public.variant_images for select
  using (true);

create policy "Admins can insert variant images"
  on public.variant_images for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update variant images"
  on public.variant_images for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete variant images"
  on public.variant_images for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index idx_product_variants_product_id on public.product_variants(product_id);
create index idx_product_variants_sort_order on public.product_variants(product_id, sort_order);
create index idx_variant_images_variant_id on public.variant_images(variant_id);
create index idx_variant_images_primary on public.variant_images(variant_id, is_primary)
  where is_primary = true;
