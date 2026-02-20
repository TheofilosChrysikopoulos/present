import { createClient } from '@/lib/supabase/server'
import type { Product, ProductWithImages, ProductListItem } from '@/lib/types'

const PRODUCT_LIST_QUERY = `
  id, sku, name_en, name_el, price, moq, category_id,
  tags, is_featured, is_new_arrival, is_active, sort_order, created_at, updated_at,
  product_images!inner (id, storage_path, alt_en, alt_el, sort_order, is_primary),
  categories (id, slug, name_en, name_el, parent_id, sort_order)
`

const PRODUCT_DETAIL_QUERY = `
  *,
  product_images (id, storage_path, alt_en, alt_el, sort_order, is_primary),
  product_variants (
    id, sku_suffix, color_name_en, color_name_el, hex_color, variant_type, sort_order,
    variant_images (id, storage_path, alt_en, alt_el, sort_order, is_primary)
  ),
  categories (id, slug, name_en, name_el, parent_id, sort_order)
`

export interface ProductFilters {
  search?: string
  categoryIds?: string[]
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  isFeatured?: boolean
  isNewArrival?: boolean
  page?: number
  limit?: number
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name'
  adminView?: boolean // show inactive products in admin
}

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = await createClient()
  const {
    search,
    categoryIds,
    tags,
    minPrice,
    maxPrice,
    isFeatured,
    isNewArrival,
    page = 1,
    limit = 24,
    sortBy = 'newest',
    adminView = false,
  } = filters

  let query = supabase.from('products').select(
    `id, sku, name_en, name_el, price, moq, category_id,
    tags, is_featured, is_new_arrival, is_active, sort_order, created_at, updated_at,
    product_images (id, storage_path, alt_en, alt_el, sort_order, is_primary),
    categories (id, slug, name_en, name_el, parent_id, sort_order)`,
    { count: 'exact' }
  )

  // Public: only active products
  if (!adminView) {
    query = query.eq('is_active', true)
  }

  if (search) {
    query = query.textSearch(
      'name_en,name_el,sku,description_en,description_el',
      search,
      { type: 'websearch', config: 'simple' }
    )
  }

  if (categoryIds?.length) {
    query = query.in('category_id', categoryIds)
  }

  if (tags?.length) {
    query = query.overlaps('tags', tags)
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice)
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice)
  }

  if (isFeatured) {
    query = query.eq('is_featured', true)
  }

  if (isNewArrival) {
    query = query.eq('is_new_arrival', true)
  }

  // Sorting
  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name':
      query = query.order('name_en', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    products: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getProductBySku(sku: string): Promise<ProductWithImages | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (id, storage_path, alt_en, alt_el, sort_order, is_primary),
      product_variants (
        id, sku_suffix, color_name_en, color_name_el, hex_color, variant_type, sort_order,
        variant_images (id, storage_path, alt_en, alt_el, sort_order, is_primary)
      ),
      categories (id, slug, name_en, name_el, parent_id, sort_order)
    `)
    .eq('sku', sku)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data as ProductWithImages
}

export async function getProductById(id: string): Promise<ProductWithImages | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (id, storage_path, alt_en, alt_el, sort_order, is_primary),
      product_variants (
        id, sku_suffix, color_name_en, color_name_el, hex_color, variant_type, sort_order,
        variant_images (id, storage_path, alt_en, alt_el, sort_order, is_primary)
      ),
      categories (id, slug, name_en, name_el, parent_id, sort_order)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as ProductWithImages
}

export async function getFeaturedProducts(limit = 8) {
  const { products } = await getProducts({ isFeatured: true, limit, sortBy: 'newest' })
  return products
}

export async function getNewArrivals(limit = 8) {
  const { products } = await getProducts({ isNewArrival: true, limit, sortBy: 'newest' })
  return products
}

export async function getAllProductSkus(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('sku')
    .eq('is_active', true)

  return data?.map((p) => p.sku) ?? []
}

export async function getAdminProductStats() {
  const supabase = await createClient()
  const [total, active] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])
  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
  }
}
