/**
 * Clears all existing products, variants, images, and categories from the database.
 * Run before a fresh import.
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function main() {
  console.log('🗑️  Clearing existing products and categories...\n')

  // 1. Delete all variant_images (cascade should handle this, but be safe)
  await supabase
    .from('variant_images')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`   Deleted variant_images`)

  // 2. Delete all product_variants
  await supabase
    .from('product_variants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`   Deleted product_variants`)

  // 3. Delete all product_images
  await supabase
    .from('product_images')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`   Deleted product_images`)

  // 4. Delete all product_sizes
  await supabase
    .from('product_sizes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`   Deleted product_sizes`)

  // 5. Delete all products
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, sku')

  if (prodErr) {
    console.error('Error fetching products:', prodErr.message)
  } else {
    console.log(`   Found ${products?.length ?? 0} products to delete`)
    if (products && products.length > 0) {
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) console.error('   Error deleting products:', error.message)
      else console.log(`   ✅ Deleted ${products.length} products`)
    }
  }

  // 6. Delete all categories
  // Delete children first, then parents
  const { data: categories } = await supabase
    .from('categories')
    .select('id, parent_id, name_en')

  if (categories && categories.length > 0) {
    // Sort: children first (those with parent_id), then roots
    const children = categories.filter(c => c.parent_id)
    const roots = categories.filter(c => !c.parent_id)

    if (children.length > 0) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', children.map(c => c.id))
      if (error) console.error('   Error deleting child categories:', error.message)
      else console.log(`   ✅ Deleted ${children.length} subcategories`)
    }

    if (roots.length > 0) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', roots.map(c => c.id))
      if (error) console.error('   Error deleting root categories:', error.message)
      else console.log(`   ✅ Deleted ${roots.length} root categories`)
    }
  } else {
    console.log('   No categories to delete')
  }

  // 7. Clear storage bucket
  console.log('\n   Clearing storage bucket...')
  const { data: folders } = await supabase.storage.from('product-images').list('products', { limit: 1000 })
  if (folders && folders.length > 0) {
    // List all files recursively and delete
    let totalDeleted = 0
    for (const folder of folders) {
      const { data: files } = await supabase.storage.from('product-images').list(`products/${folder.name}`, { limit: 1000 })
      if (files && files.length > 0) {
        // For each variant folder
        for (const variantFolder of files) {
          const { data: images } = await supabase.storage.from('product-images').list(`products/${folder.name}/${variantFolder.name}`, { limit: 1000 })
          if (images && images.length > 0) {
            const paths = images.map(img => `products/${folder.name}/${variantFolder.name}/${img.name}`)
            await supabase.storage.from('product-images').remove(paths)
            totalDeleted += paths.length
          }
        }
      }
    }
    console.log(`   ✅ Deleted ${totalDeleted} files from storage`)
  } else {
    console.log('   No files in storage')
  }

  console.log('\n✅ Database cleared. Ready for fresh import.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
