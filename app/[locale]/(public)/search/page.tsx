import { Suspense } from 'react'
import { getTranslations, getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { getProducts } from '@/lib/queries/products'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductSearch } from '@/components/catalog/ProductSearch'
import { EmptyState } from '@/components/shared/EmptyState'
import { Search } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Search' }
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams
  const [t, locale] = await Promise.all([getTranslations('catalog'), getLocale()])

  const { products, total } = await getProducts({
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
    limit: 24,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md mb-6">
        <Suspense>
          <ProductSearch />
        </Suspense>
      </div>

      {sp.q && (
        <p className="text-sm text-stone-500 mb-6">
          {total > 0
            ? `${total} results for "${sp.q}"`
            : `No results for "${sp.q}"`}
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title={t('noResults')}
          description={t('noResultsHint')}
        />
      ) : (
        <ProductGrid products={products as any} />
      )}
    </div>
  )
}
