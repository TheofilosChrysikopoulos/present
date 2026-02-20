import { getCategories } from '@/lib/queries/categories'
import { ProductForm } from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Add Product</h1>
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  )
}
