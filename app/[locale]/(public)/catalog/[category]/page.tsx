import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import {
  getCategoryBySlug,
  getCategoryTree,
  getCategoryAncestors,
  getCategoryDescendantIds,
} from '@/lib/queries/categories'
import { getProducts } from '@/lib/queries/products'
import { getLocalizedField } from '@/lib/types'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductFilters } from '@/components/catalog/ProductFilters'
import { ProductSearch } from '@/components/catalog/ProductSearch'
import { CategoryBreadcrumb } from '@/components/catalog/CategoryBreadcrumb'
import { EmptyState } from '@/components/shared/EmptyState'
import { Package } from 'lucide-react'

interface CategoryPageProps {
  params: Promise<{ locale: string; category: string }>
  searchParams: Promise<{
    q?: string
    tag?: string | string[]
    page?: string
    sort?: string
  }>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug, locale } = await params
  const cat = await getCategoryBySlug(slug)
  if (!cat) return {}
  return {
    title: getLocalizedField(cat, locale),
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: slug, locale } = await params
  const sp = await searchParams

  const [category, tree] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryTree(),
  ])

  if (!category) notFound()

  const ancestors = await getCategoryAncestors(category.id)
  const categoryIds = getCategoryDescendantIds(tree, category.id)
  if (!categoryIds.includes(category.id)) categoryIds.push(category.id)

  const tags = sp.tag
    ? Array.isArray(sp.tag)
      ? sp.tag
      : [sp.tag]
    : []

  const { products, total, page, totalPages } = await getProducts({
    search: sp.q,
    categoryIds,
    tags,
    page: sp.page ? Number(sp.page) : 1,
    limit: 24,
  })

  const t = await getTranslations('catalog')
  const categoryName = getLocalizedField(category, locale)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <CategoryBreadcrumb current={category} ancestors={ancestors} />
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">{categoryName}</h1>
        {total > 0 && (
          <p className="text-sm text-stone-500">
            {t('showing', { count: total })}
          </p>
        )}
      </div>

      <div className="mb-6 max-w-md">
        <Suspense>
          <ProductSearch />
        </Suspense>
      </div>

      <div className="flex gap-8">
        <div className="hidden lg:block w-52 flex-shrink-0">
          <Suspense>
            <ProductFilters tree={tree} currentCategorySlug={slug} />
          </Suspense>
        </div>

        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title={t('noResults')}
              description={t('noResultsHint')}
            />
          ) : (
            <ProductGrid products={products as any} />
          )}
        </div>
      </div>
    </div>
  )
}
