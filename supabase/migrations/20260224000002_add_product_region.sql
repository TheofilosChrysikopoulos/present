-- Add region column to products for corfu/greece filtering
alter table public.products
  add column region text not null default 'all'
    check (region in ('all', 'corfu', 'greece'));

create index idx_products_region on public.products(region);

-- Update the public read policy to allow region-aware filtering at the app level
-- The existing policy allows active products to be read; region filtering will be
-- handled at the application level based on the logged-in customer's region.
