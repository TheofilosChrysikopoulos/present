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
      <section className="bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-28 md:py-40">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.05] tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl mb-10 leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>
            <Button asChild size="lg" className="bg-white text-black hover:bg-neutral-100 gap-2 font-medium h-12 px-8 text-base">
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
        <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 md:py-28">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{t('categories')}</h2>
            <Link
              href={`${base}/catalog`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tree.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                href={`${base}/catalog/${cat.slug}`}
                className="group flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-2xl hover:bg-secondary hover:shadow-sm transition-all duration-300 text-center"
              >
                <span className="text-sm font-medium text-foreground tracking-tight">
                  {getLocalizedField(cat, locale)}
                </span>
                {cat.children && cat.children.length > 0 && (
                  <span className="text-xs text-muted-foreground mt-1">
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
        <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 md:py-28 border-t border-border">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{t('featured')}</h2>
            <Link
              href={`${base}/catalog?featured=true`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={featured as any} />
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 md:py-28 border-t border-border">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{t('newArrivals')}</h2>
            <Link
              href={`${base}/catalog?new=true`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors duration-200"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={newArrivals as any} />
        </section>
      )}

      {/* CTA when no products yet */}
      {featured.length === 0 && newArrivals.length === 0 && (
        <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-24 text-center">
          <p className="text-muted-foreground text-lg mb-8">Products coming soon</p>
          <Button asChild variant="outline" size="lg">
            <Link href={`${base}/catalog`}>Browse Catalog</Link>
          </Button>
        </section>
      )}
    </div>
  )
}
