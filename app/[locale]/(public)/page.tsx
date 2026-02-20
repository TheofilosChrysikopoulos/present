import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { getFeaturedProducts, getNewArrivals } from '@/lib/queries/products'
import { getCategoryTree } from '@/lib/queries/categories'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { getLocalizedField } from '@/lib/types'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'ePresent — Wholesale Tourist Products',
}

export default async function HomePage() {
  const [t, locale, tree, featured, newArrivals] = await Promise.all([
    getTranslations('home'),
    getLocale(),
    getCategoryTree(),
    getFeaturedProducts(8),
    getNewArrivals(8),
  ])

  const base = locale === 'el' ? '/el' : ''
  const tNav = await getTranslations('nav')

  return (
    <div>
      {/* Hero */}
      <section className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-stone-300 text-lg mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <Button asChild size="lg" variant="secondary" className="gap-2 font-semibold">
              <Link href={`${base}/catalog`}>
                {t('hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      {tree.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">{t('categories')}</h2>
            <Link
              href={`${base}/catalog`}
              className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tree.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                href={`${base}/catalog/${cat.slug}`}
                className="group flex flex-col items-center justify-center p-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 hover:border-stone-300 transition-all text-center"
              >
                <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">
                  {getLocalizedField(cat, locale)}
                </span>
                {cat.children && cat.children.length > 0 && (
                  <span className="text-xs text-stone-400 mt-0.5">
                    {cat.children.length} subcategories
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">{t('featured')}</h2>
            <Link
              href={`${base}/catalog?featured=true`}
              className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={featured as any} />
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">{t('newArrivals')}</h2>
            <Link
              href={`${base}/catalog?new=true`}
              className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={newArrivals as any} />
        </section>
      )}

      {/* CTA when no products yet */}
      {featured.length === 0 && newArrivals.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-stone-400 text-lg mb-6">Products coming soon</p>
          <Button asChild variant="outline">
            <Link href={`${base}/catalog`}>Browse Catalog</Link>
          </Button>
        </section>
      )}
    </div>
  )
}
