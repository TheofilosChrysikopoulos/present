import { Suspense } from 'react'
import { getTranslations, getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { getProducts } from '@/lib/queries/products'
import { getCategoryTree } from '@/lib/queries/categories'
import { ProductGrid, ProductGridSkeleton } from '@/components/catalog/ProductGrid'
import { ProductFilters } from '@/components/catalog/ProductFilters'
import { ProductSearch } from '@/components/catalog/ProductSearch'
import { EmptyState } from '@/components/shared/EmptyState'
import { Package } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('catalog')
  return { title: t('title') }
}

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string
    tag?: string | string[]
    minPrice?: string
    maxPrice?: string
    sort?: string
    page?: string
    featured?: string
    new?: string
  }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const [t, locale, tree] = await Promise.all([
    getTranslations('catalog'),
    getLocale(),
    getCategoryTree(),
  ])

  const tags = params.tag
    ? Array.isArray(params.tag)
      ? params.tag
      : [params.tag]
    : []

  const sortMap: Record<string, 'newest' | 'price_asc' | 'price_desc' | 'name'> = {
    newest: 'newest',
    price_asc: 'price_asc',
    price_desc: 'price_desc',
    name: 'name',
  }

  const { products, total, page, totalPages } = await getProducts({
    search: params.q,
    tags,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sortBy: sortMap[params.sort ?? ''] ?? 'newest',
    isFeatured: params.featured === 'true',
    isNewArrival: params.new === 'true',
    page: params.page ? Number(params.page) : 1,
    limit: 24,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">{t('title')}</h1>
        {total > 0 && (
          <p className="text-sm text-stone-500">
            {t('showing', { count: total })}
          </p>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-6 max-w-md">
        <Suspense>
          <ProductSearch />
        </Suspense>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <div className="hidden lg:block w-52 flex-shrink-0">
          <Suspense>
            <ProductFilters tree={tree} />
          </Suspense>
        </div>

        {/* Product grid */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              searchParams={params}
              locale={locale}
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
}: {
  page: number
  totalPages: number
  searchParams: Record<string, string | string[] | undefined>
  locale: string
}) {
  const base = locale === 'el' ? '/el' : ''

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
    return `${base}/catalog${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <a
          href={buildUrl(page - 1)}
          className="px-3 py-1.5 text-sm border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50"
        >
          Previous
        </a>
      )}
      <span className="text-sm text-stone-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <a
          href={buildUrl(page + 1)}
          className="px-3 py-1.5 text-sm border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50"
        >
          Next
        </a>
      )}
    </div>
  )
}
