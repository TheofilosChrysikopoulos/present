-- Add price and discount_price columns to product_sizes
-- so each size can have its own pricing.

alter table public.product_sizes
  add column price numeric(10,2) default null,
  add column discount_price numeric(10,2) default null;

-- Ensure discount_price < price when both are set
alter table public.product_sizes
  add constraint product_sizes_discount_check
  check (discount_price is null or price is null or discount_price < price);
