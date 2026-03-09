'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { QuickAddToCart } from './QuickAddToCart'
import { CardImageGallery } from './CardImageGallery'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    sku: string
    name_en: string
    name_el: string
    price: number
    moq: number
    is_featured: boolean
    is_new_arrival: boolean
    tags: string[]
    product_images: Array<{
      storage_path: string
      alt_en: string | null
      alt_el: string | null
      is_primary: boolean
    }>
    product_variants?: Array<{
      id: string
      hex_color: string | null
      color_name_en: string
      color_name_el: string
      variant_type: string
    }>
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const ct = useTranslations('common')

  const name = locale === 'el' ? product.name_el : product.name_en
  const href = `/${locale}/product/${product.sku}`

  // Show up to 4 color swatches
  const swatches = product.product_variants?.slice(0, 4) ?? []

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#B13D82]/60 hover:shadow-lg transition-all duration-200 h-full">
      <Link href={href} className="flex-1 flex flex-col">
        {/* Image gallery */}
        <div className="relative">
          <CardImageGallery
            images={product.product_images}
            productName={name}
            locale={locale}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.is_new_arrival && (
              <Badge className="bg-[#1e3a5f] text-white text-[10px] px-1.5 py-0.5 h-auto">
                {ct('newArrival')}
              </Badge>
            )}
            {product.is_featured && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 h-auto"
              >
                {ct('featured')}
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 pb-1 flex-1 flex flex-col">
          <p className="text-[11px] text-slate-400 font-mono mb-0.5">{product.sku}</p>
          <h3 className="text-sm font-medium text-[#1e3a5f] line-clamp-2 leading-snug">
            {name}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-2">
            <PriceBadge price={product.price} size="sm" />
            {product.moq > 1 && (
              <span className="text-[11px] text-slate-400">
                {t('moqNote', { moq: product.moq })}
              </span>
            )}
          </div>

          {/* Color swatches */}
          {swatches.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              {swatches.map((v) => (
                <span
                  key={v.id}
                  className="h-3.5 w-3.5 rounded-full border border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: v.hex_color ?? '#e7e5e4' }}
                  title={locale === 'el' ? v.color_name_el : v.color_name_en}
                />
              ))}
              {(product.product_variants?.length ?? 0) > 4 && (
                <span className="text-[10px] text-slate-400">
                  +{(product.product_variants?.length ?? 0) - 4}
                </span>
              )}
            </div>
          )}
          {/* Spacer to push add-to-cart down */}
          <div className="flex-1" />
        </div>
      </Link>

      {/* Quick add-to-cart — qty (left) + cart icon (right) */}
      <div className="px-3 pb-2.5 pt-0">
        <QuickAddToCart product={product} />
      </div>
    </div>
  )
}
