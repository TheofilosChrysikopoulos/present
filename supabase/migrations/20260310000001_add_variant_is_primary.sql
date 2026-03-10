-- Add is_primary flag to product_variants so one variant can be marked as the main/default variant
ALTER TABLE public.product_variants
  ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
