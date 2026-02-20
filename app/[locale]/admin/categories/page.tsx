import { getCategoryTree } from '@/lib/queries/categories'
import { AdminCategoryTree } from './AdminCategoryTree'

export default async function AdminCategoriesPage() {
  const tree = await getCategoryTree()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
      </div>
      <AdminCategoryTree tree={tree} />
    </div>
  )
}
