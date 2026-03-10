-- Add discount_price column to products table.
-- When discount_price is not null, it represents the new (discounted) sale price,
-- and the existing "price" column becomes the original price shown with strikethrough.
ALTER TABLE products
  ADD COLUMN discount_price NUMERIC(10, 2) DEFAULT NULL;

-- Ensure discount_price, when set, is less than the original price
ALTER TABLE products
  ADD CONSTRAINT chk_discount_price_lt_price
  CHECK (discount_price IS NULL OR discount_price < price);
