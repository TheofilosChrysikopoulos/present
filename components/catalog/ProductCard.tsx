'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { QuickAddToCart } from './QuickAddToCart'
import { CardImageGallery } from './CardImageGallery'
import { cn } from '@/lib/utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

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
    discount_price?: number | null
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
      is_primary: boolean
      sort_order: number
      variant_images?: VariantImage[]
    }>
    product_sizes?: Array<{
      id: string
      label_en: string
      label_el: string
      sku_suffix: string | null
      price: number | null
      discount_price: number | null
      sort_order: number
    }>
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const ct = useTranslations('common')

  const name = locale === 'el' ? product.name_el : product.name_en
  const href = `/${locale}/product/${product.sku}`

  // Variants sorted: primary first, then by sort_order
  const sortedVariants = useMemo(
    () =>
      [...(product.product_variants ?? [])]
        .filter((v) => (v.variant_images?.length ?? 0) > 0)
        .sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.sort_order - b.sort_order
        }),
    [product.product_variants]
  )

  // Default to primary variant (index 0 since sorted primary-first)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)

  // Sizes sorted by sort_order, default to first
  const sortedSizes = useMemo(
    () => [...(product.product_sizes ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product.product_sizes]
  )
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0)
  const selectedSize = sortedSizes[selectedSizeIdx] ?? null

  // Effective price: from selected size if available, otherwise product level
  const effectivePrice = selectedSize?.price ?? product.price
  const effectiveDiscountPrice = selectedSize ? selectedSize.discount_price : (product.discount_price ?? null)

  // Images for the selected variant (primary image first), for the hero gallery
  const heroImages = useMemo(() => {
    if (sortedVariants.length === 0) {
      return [...product.product_images].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return 0
      })
    }
    const vi = sortedVariants[selectedVariantIdx]?.variant_images ?? []
    return [...vi].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return a.sort_order - b.sort_order
    })
  }, [sortedVariants, selectedVariantIdx, product.product_images])

  // Primary image per variant for the thumbnail grid
  const variantThumbs = useMemo(
    () =>
      sortedVariants.map((v) => {
        const imgs = [...(v.variant_images ?? [])].sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.sort_order - b.sort_order
        })
        return {
          id: v.id,
          storage_path: imgs[0]?.storage_path ?? '',
          alt_en: imgs[0]?.alt_en ?? null,
          alt_el: imgs[0]?.alt_el ?? null,
        }
      }),
    [sortedVariants]
  )

  // Grid layout for variant thumbs
  // ≤2 → all in one row; 3→2+1; 4→2+2; 5→3+2; 6→3+3; 7→4+3; 8→4+4; >8→rows of 4, scrollable
  const thumbRows = useMemo(() => {
    const n = variantThumbs.length
    if (n <= 1) return [] // don't show grid for 0 or 1 variant
    if (n <= 2) return [variantThumbs]
    if (n <= 8) {
      const topCount = Math.ceil(n / 2)
      return [variantThumbs.slice(0, topCount), variantThumbs.slice(topCount)]
    }
    // >8: rows of 4
    const rows: typeof variantThumbs[] = []
    for (let i = 0; i < n; i += 4) {
      rows.push(variantThumbs.slice(i, i + 4))
    }
    return rows
  }, [variantThumbs])

  function selectVariant(idx: number) {
    setSelectedVariantIdx(idx)
    setImageIndex(0)
  }

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#B13D82]/60 hover:shadow-lg transition-all duration-200 h-full">
      <Link href={href} className="flex-1 flex flex-col">
        {/* Hero image — primary variant, scrollable angles */}
        <div className="relative">
          <CardImageGallery
            images={heroImages}
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
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-auto">
                {ct('featured')}
              </Badge>
            )}
          </div>
        </div>

        {/* Variant thumbnail grid */}
        {thumbRows.length > 0 && (
          <div
            className={cn(
              'bg-slate-50 border-t border-slate-100',
              thumbRows.length > 2 && 'max-h-28 overflow-y-auto'
            )}
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          >
            {thumbRows.map((row, ri) => (
              <div key={ri} className="flex">
                {row.map((thumb, ti) => {
                  const globalIdx = thumbRows.slice(0, ri).reduce((s, r) => s + r.length, 0) + ti
                  const isActive = globalIdx === selectedVariantIdx
                  return (
                    <button
                      key={thumb.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        selectVariant(globalIdx)
                      }}
                      className={cn(
                        'relative flex-1 aspect-square border-r border-b border-slate-100 last:border-r-0 transition-all',
                        isActive ? 'ring-2 ring-inset ring-[#1e3a5f]' : 'hover:bg-slate-100'
                      )}
                    >
                      <Image
                        src={imgUrl(thumb.storage_path)}
                        alt={(locale === 'el' ? thumb.alt_el : thumb.alt_en) ?? name}
                        fill
                        sizes="80px"
                        className="object-contain p-0.5"
                      />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-3 pb-1 flex-1 flex flex-col">
          <p className="text-[11px] text-slate-400 font-mono mb-0.5">{product.sku}</p>
          <h3 className="text-sm font-medium text-[#1e3a5f] line-clamp-2 leading-snug">
            {name}
          </h3>

          {/* Size selector */}
          {sortedSizes.length > 0 && (
            <div
              className="flex flex-wrap gap-1 mt-1.5"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              {sortedSizes.map((size, si) => (
                <button
                  key={size.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedSizeIdx(si)
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded border text-[11px] font-medium transition-all',
                    si === selectedSizeIdx
                      ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-400'
                  )}
                >
                  {size.sku_suffix || (locale === 'el' ? size.label_el : size.label_en)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <PriceBadge price={effectivePrice} discountPrice={effectiveDiscountPrice} size="sm" />
            {product.moq > 1 && (
              <span className="text-[11px] text-slate-400">
                {t('moqNote', { moq: product.moq })}
              </span>
            )}
          </div>

          {/* Spacer to push add-to-cart down */}
          <div className="flex-1" />
        </div>
      </Link>

      {/* Quick add-to-cart */}
      <div className="px-3 pb-2.5 pt-0">
        <QuickAddToCart product={product} selectedSize={selectedSize} selectedVariant={sortedVariants[selectedVariantIdx] ?? null} />
      </div>
    </div>
  )
}
