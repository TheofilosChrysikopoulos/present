-- Add company and sellable_variants columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS company text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sellable_variants boolean DEFAULT true;
