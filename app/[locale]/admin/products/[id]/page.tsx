import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/queries/products'
import { getCategories } from '@/lib/queries/categories'
import { ProductForm } from '@/components/admin/ProductForm'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ])

  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Edit Product</h1>
      <p className="text-sm text-stone-500 mb-6 font-mono">{product.sku}</p>
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  )
}
