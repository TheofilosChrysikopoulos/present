'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { QuickAddToCart } from './QuickAddToCart'
import { CardImageGallery } from './CardImageGallery'
import { cn } from '@/lib/utils'

interface VariantImage {
  id: string
  storage_path: string
  alt_en: string | null
  alt_el: string | null
  sort_order: number
  is_primary: boolean
}

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
      sort_order: number
      variant_images?: VariantImage[]
    }>
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const ct = useTranslations('common')

  const name = locale === 'el' ? product.name_el : product.name_en
  const href = `/${locale}/product/${product.sku}`

  // Variants sorted by sort_order, only those with images
  const variantsWithImages = useMemo(
    () =>
      (product.product_variants ?? [])
        .filter((v) => (v.variant_images?.length ?? 0) > 0)
        .sort((a, b) => a.sort_order - b.sort_order),
    [product.product_variants]
  )

  const allSwatches = useMemo(
    () => (product.product_variants ?? []).sort((a, b) => a.sort_order - b.sort_order).slice(0, 6),
    [product.product_variants]
  )

  // -1 = base product images, 0+ = variant index in variantsWithImages
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(-1)
  const [imageIndex, setImageIndex] = useState(0)

  // Current images: variant images if a variant with images is selected, else product images
  const currentImages = useMemo(() => {
    if (selectedVariantIdx >= 0 && selectedVariantIdx < variantsWithImages.length) {
      const vi = variantsWithImages[selectedVariantIdx].variant_images ?? []
      return [...vi].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.sort_order - b.sort_order
      })
    }
    return [...product.product_images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return 0
    })
  }, [selectedVariantIdx, variantsWithImages, product.product_images])

  function selectVariant(variantId: string) {
    const idx = variantsWithImages.findIndex((v) => v.id === variantId)
    if (idx >= 0 && idx === selectedVariantIdx) {
      // Deselect - go back to base product images
      setSelectedVariantIdx(-1)
      setImageIndex(0)
    } else if (idx >= 0) {
      setSelectedVariantIdx(idx)
      setImageIndex(0)
    }
  }

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#B13D82]/60 hover:shadow-lg transition-all duration-200 h-full">
      <Link href={href} className="flex-1 flex flex-col">
        {/* Image gallery */}
        <div className="relative">
          <CardImageGallery
            images={currentImages}
            productName={name}
            locale={locale}
            activeIndex={imageIndex}
            onChangeIndex={setImageIndex}
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

          {/* Color swatches — interactive */}
          {allSwatches.length > 0 && (
            <div
              className="mt-2 flex items-center gap-1"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              {allSwatches.map((v) => {
                const isActive =
                  selectedVariantIdx >= 0 &&
                  variantsWithImages[selectedVariantIdx]?.id === v.id
                return (
                  <button
                    key={v.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      selectVariant(v.id)
                    }}
                    className={cn(
                      'h-4 w-4 rounded-full border flex-shrink-0 transition-all',
                      isActive
                        ? 'border-[#1e3a5f] ring-1 ring-[#1e3a5f]/40 scale-110'
                        : 'border-slate-200 hover:scale-105'
                    )}
                    style={{ backgroundColor: v.hex_color ?? '#e7e5e4' }}
                    title={locale === 'el' ? v.color_name_el : v.color_name_en}
                  />
                )
              })}
              {(product.product_variants?.length ?? 0) > 6 && (
                <span className="text-[10px] text-slate-400">
                  +{(product.product_variants?.length ?? 0) - 6}
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
