'use client'

import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { TagList } from '@/components/shared/TagList'
import { ProductImageGallery } from './ProductImageGallery'
import { SizeVariantSelector } from './SizeVariantSelector'
import { AddToCartButton } from './AddToCartButton'
import { getLocalizedField, getLocalizedDescription } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { ProductWithImages, ProductVariantWithImages, ProductSize } from '@/lib/types'

interface ProductDetailProps {
  product: ProductWithImages
}

export function ProductDetail({ product }: ProductDetailProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const ct = useTranslations('common')

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null)

  const selectedSize = selectedSizeId
    ? (product.product_sizes?.find((s) => s.id === selectedSizeId) as ProductSize | undefined) ?? null
    : null

  const name = getLocalizedField(product, locale)
  const description = getLocalizedDescription(product, locale)

  // Sort variants by sort_order; find primary
  const sortedVariants = useMemo(
    () => [...(product.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product.product_variants]
  )

  const defaultVariantIdx = useMemo(() => {
    const primaryIdx = sortedVariants.findIndex((v) => v.is_primary)
    return primaryIdx >= 0 ? primaryIdx : 0
  }, [sortedVariants])

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(defaultVariantIdx)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const selectedVariant = sortedVariants[selectedVariantIdx] as ProductVariantWithImages | undefined

  // Images for the selected variant, primary first
  const galleryImages = useMemo(() => {
    if (!selectedVariant) {
      // Fallback to product_images if no variants
      return (product.product_images ?? []).map((img) => ({
        ...img,
        variantId: undefined as string | undefined,
      }))
    }

    const vi = [...(selectedVariant.variant_images ?? [])].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return a.sort_order - b.sort_order
    })

    return vi.map((img) => ({
      ...img,
      variantId: selectedVariant.id,
    }))
  }, [selectedVariant, product.product_images])

  function selectVariant(idx: number) {
    setSelectedVariantIdx(idx)
    setActiveImageIndex(0)
  }

  const base = `/${locale}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href={`${base}/`} className="hover:text-[#1e3a5f]">{ct('back')}</Link>
        <span>/</span>
        <Link href={`${base}/catalog`} className="hover:text-[#1e3a5f]">
          Catalog
        </Link>
        {product.categories && (
          <>
            <span>/</span>
            <Link
              href={`${base}/catalog/${product.categories.slug}`}
              className="hover:text-[#1e3a5f]"
            >
              {getLocalizedField(product.categories, locale)}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#1e3a5f] font-medium truncate max-w-48">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image gallery — shows selected variant's images */}
        <div>
          <ProductImageGallery
            images={galleryImages}
            productName={name}
            locale={locale}
            activeIndex={activeImageIndex}
            onChangeIndex={setActiveImageIndex}
          />
        </div>

        {/* Product info */}
        <div>
          {/* Badges */}
          <div className="flex gap-2 mb-3">
            {product.is_new_arrival && (
              <Badge className="bg-[#1e3a5f] text-white text-xs">
                {ct('newArrival')}
              </Badge>
            )}
            {product.is_featured && (
              <Badge variant="secondary" className="text-xs">
                {ct('featured')}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-1">{name}</h1>
          <p className="text-sm text-slate-400 font-mono mb-4">
            {t('sku')}: {product.sku}
            {selectedVariant?.sku_suffix && selectedVariant.sku_suffix}
          </p>

          {/* Price and MOQ */}
          <div className="flex items-baseline gap-3 mb-4">
            <PriceBadge price={product.price} size="lg" />
            {product.moq > 1 && (
              <span className="text-sm text-slate-500">
                {t('moqNote', { moq: product.moq })}
              </span>
            )}
          </div>

          {/* Category */}
          {product.categories && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-slate-500">{t('category')}:</span>
              <Link
                href={`${base}/catalog/${product.categories.slug}`}
                className="text-slate-700 hover:text-[#1e3a5f] font-medium"
              >
                {getLocalizedField(product.categories, locale)}
              </Link>
            </div>
          )}

          {/* Variant selector */}
          {sortedVariants.length > 1 && (
            <div className="mb-4">
              <span className="text-sm text-slate-500 block mb-2">{t('variants')}:</span>
              <div className="flex flex-wrap gap-2">
                {sortedVariants.map((v, i) => {
                  const isActive = i === selectedVariantIdx
                  const variantName = locale === 'el' ? v.color_name_el : v.color_name_en
                  return (
                    <button
                      key={v.id}
                      onClick={() => selectVariant(i)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all',
                        isActive
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f] font-medium'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      )}
                    >
                      {v.hex_color && (
                        <span
                          className="h-4 w-4 rounded-full border border-slate-200 flex-shrink-0"
                          style={{ backgroundColor: v.hex_color }}
                        />
                      )}
                      {variantName || `Variant ${i + 1}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Single variant indicator */}
          {sortedVariants.length === 1 && selectedVariant && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-slate-500">{t('variant')}:</span>
              <div className="flex items-center gap-1.5">
                {selectedVariant.hex_color && (
                  <span
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: selectedVariant.hex_color }}
                  />
                )}
                <span className="text-slate-700 font-medium">
                  {locale === 'el'
                    ? selectedVariant.color_name_el
                    : selectedVariant.color_name_en}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mb-4">
              <TagList tags={product.tags} />
            </div>
          )}

          <Separator className="my-5" />

          {/* Size variants */}
          {(product.product_sizes?.length ?? 0) > 0 && (
            <>
              <div className="mb-5">
                <SizeVariantSelector
                  sizes={product.product_sizes as ProductSize[]}
                  selectedSizeId={selectedSizeId}
                  onSelect={setSelectedSizeId}
                />
              </div>
              <Separator className="my-5" />
            </>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} selectedVariant={selectedVariant ?? null} selectedSize={selectedSize} />

          {/* Description */}
          {description && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-2">
                  {t('description')}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
