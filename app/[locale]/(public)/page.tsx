import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { getFeaturedProducts, getNewArrivals } from '@/lib/queries/products'
import { getCategoryTree } from '@/lib/queries/categories'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { getLocalizedField } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { HeroRegisterButton } from '@/components/layout/HeroRegisterButton'

export const metadata: Metadata = {
  title: 'Present Accessories — Wholesale Tourist Products',
}

export default async function HomePage() {
  const [t, locale, tree, featured, newArrivals] = await Promise.all([
    getTranslations('home'),
    getLocale(),
    getCategoryTree(),
    getFeaturedProducts(8),
    getNewArrivals(8),
  ])

  const base = `/${locale}`
  const tNav = await getTranslations('nav')

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/background2.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 via-[#1e3a5f]/75 to-[#1e3a5f]/50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/logo.png"
                alt="Present Accessories"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <span className="text-[#B13D82] text-sm font-semibold tracking-widest uppercase">
                Present Accessories
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-white">
              {t('hero.title')}
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center gap-3">
              <Button asChild size="lg" className="gap-2 font-semibold bg-[#BFDBFE] hover:bg-[#93C5FD] text-[#1e3a5f] border-0">
                <Link href={`${base}/catalog`}>
                  {t('hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <HeroRegisterButton label={t('hero.register', { defaultValue: 'Get Started' })} />
            </div>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      {tree.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1e3a5f]">{t('categories')}</h2>
            <Link
              href={`${base}/catalog`}
              className="text-sm text-slate-500 hover:text-[#1e3a5f] flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tree.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                href={`${base}/catalog/${cat.slug}`}
                className="group flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:border-[#B13D82] hover:shadow-md transition-all text-center"
              >
                <span className="text-sm font-medium text-slate-700 group-hover:text-[#1e3a5f]">
                  {getLocalizedField(cat, locale)}
                </span>
                {cat.children && cat.children.length > 0 && (
                  <span className="text-xs text-slate-400 mt-0.5">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1e3a5f]">{t('featured')}</h2>
            <Link
              href={`${base}/catalog?featured=true`}
              className="text-sm text-slate-500 hover:text-[#1e3a5f] flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={featured as any} />
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1e3a5f]">{t('newArrivals')}</h2>
            <Link
              href={`${base}/catalog?new=true`}
              className="text-sm text-slate-500 hover:text-[#1e3a5f] flex items-center gap-1"
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
