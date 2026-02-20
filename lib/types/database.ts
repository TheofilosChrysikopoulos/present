// Hand-written TypeScript types matching the database schema.

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  updated_at: string | null
  created_at: string
}

export interface Category {
  id: string
  slug: string
  name_en: string
  name_el: string
  parent_id: string | null
  sort_order: number
  created_at: string
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

export interface Product {
  id: string
  sku: string
  name_en: string
  name_el: string
  description_en: string | null
  description_el: string | null
  price: number
  moq: number
  category_id: string | null
  tags: string[]
  is_featured: boolean
  is_new_arrival: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  alt_en: string | null
  alt_el: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku_suffix: string | null
  color_name_en: string
  color_name_el: string
  hex_color: string | null
  variant_type: 'swatch' | 'image'
  sort_order: number
  created_at: string
}

export interface VariantImage {
  id: string
  variant_id: string
  storage_path: string
  alt_en: string | null
  alt_el: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface Enquiry {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  message: string | null
  cart_snapshot: EnquiryCartItem[]
  status: 'new' | 'read' | 'replied' | 'archived'
  created_at: string
}

export interface EnquiryCartItem {
  product_id: string
  sku: string
  name_en: string
  name_el: string
  qty: number
  price: number
  variant_id?: string
  variant_color_en?: string
  variant_color_el?: string
}

// Composite types for joined queries
export interface ProductWithImages extends Product {
  product_images: ProductImage[]
  product_variants: ProductVariantWithImages[]
  categories: Category | null
}

export interface ProductVariantWithImages extends ProductVariant {
  variant_images: VariantImage[]
}

export interface ProductListItem extends Product {
  primary_image: ProductImage | null
  category: Category | null
}
