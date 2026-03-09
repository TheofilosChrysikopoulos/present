-- Enable the unaccent extension for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Search products by text (accent-insensitive, case-insensitive, substring match)
-- Also searches category names AND parent category names
CREATE OR REPLACE FUNCTION search_product_ids(search_term text)
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN categories pc ON c.parent_id = pc.id
  WHERE unaccent(lower(p.name_en)) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(p.name_el)) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(p.sku)) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(p.description_en, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(p.description_el, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(c.name_en, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(c.name_el, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(pc.name_en, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(pc.name_el, ''))) LIKE '%' || unaccent(lower(search_term)) || '%';
END;
$$ LANGUAGE plpgsql STABLE;

-- Search customers by text (accent-insensitive, case-insensitive, substring match)
-- Searches email, name, location, status, AND region
CREATE OR REPLACE FUNCTION search_customer_ids(search_term text)
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT cu.id
  FROM customers cu
  WHERE unaccent(lower(COALESCE(cu.email, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(cu.first_name, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(cu.last_name, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(cu.location, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(cu.status, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(cu.region, ''))) LIKE '%' || unaccent(lower(search_term)) || '%';
END;
$$ LANGUAGE plpgsql STABLE;

-- Search enquiries by text (accent-insensitive, case-insensitive, substring match)
-- Also searches inside cart_snapshot JSONB (product names, SKUs, etc.)
CREATE OR REPLACE FUNCTION search_enquiry_ids(search_term text)
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT e.id
  FROM enquiries e
  WHERE unaccent(lower(COALESCE(e.name, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(e.email, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(e.company, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(e.message, ''))) LIKE '%' || unaccent(lower(search_term)) || '%'
     OR unaccent(lower(COALESCE(e.cart_snapshot::text, ''))) LIKE '%' || unaccent(lower(search_term)) || '%';
END;
$$ LANGUAGE plpgsql STABLE;
