import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
import {
  getCategoryBySlug,
  getCategoryTree,
  getCategoryAncestors,
  getCategoryDescendantIds,
} from '@/lib/queries/categories'
import { getProducts } from '@/lib/queries/products'
import { getShowSubcategories } from '@/lib/queries/settings'
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

  const [category, tree, showSubcategories] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryTree(),
    getShowSubcategories(),
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
            <ProductFilters tree={tree} currentCategorySlug={slug} showSubcategories={showSubcategories} />
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

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              searchParams={sp}
              locale={locale}
              categorySlug={slug}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  searchParams,
  locale,
  categorySlug,
}: {
  page: number
  totalPages: number
  searchParams: Record<string, string | string[] | undefined>
  locale: string
  categorySlug: string
}) {
  function buildUrl(p: number) {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, val]) => {
      if (key === 'page') return
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(key, v))
      } else if (val) {
        params.set(key, val)
      }
    })
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/${locale}/catalog/${categorySlug}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
        >
          Previous
        </Link>
      )}
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={buildUrl(page + 1)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
        >
          Next
        </Link>
      )}
    </div>
  )
}
