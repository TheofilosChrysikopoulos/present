'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { TagList } from '@/components/shared/TagList'
import { ProductImageGallery } from './ProductImageGallery'
import { ColorVariantSelector } from './ColorVariantSelector'
import { SizeVariantSelector } from './SizeVariantSelector'
import { AddToCartButton } from './AddToCartButton'
import { getLocalizedField, getLocalizedDescription } from '@/lib/types'
import type { ProductWithImages, ProductVariantWithImages, ProductSize } from '@/lib/types'
import { cn } from '@/lib/utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

interface ProductDetailProps {
  product: ProductWithImages
}

export function ProductDetail({ product }: ProductDetailProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const ct = useTranslations('common')

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null)

  const selectedVariant = selectedVariantId
    ? (product.product_variants?.find((v) => v.id === selectedVariantId) as ProductVariantWithImages | undefined) ?? null
    : null

  const selectedSize = selectedSizeId
    ? (product.product_sizes?.find((s) => s.id === selectedSizeId) as ProductSize | undefined) ?? null
    : null

  const name = getLocalizedField(product, locale)
  const description = getLocalizedDescription(product, locale)

  // Build gallery images: if variant with images is selected, show variant images; else product images
  const galleryImages =
    selectedVariant?.variant_type === 'image' &&
    selectedVariant.variant_images?.length > 0
      ? selectedVariant.variant_images.map((vi) => ({
          ...vi,
          sort_order: vi.sort_order,
        }))
      : (product.product_images ?? [])

  const base = locale === 'el' ? '/el' : ''

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10">
        <Link href={`${base}/`} className="hover:text-foreground transition-colors">{ct('back')}</Link>
        <span className="text-border">/</span>
        <Link href={`${base}/catalog`} className="hover:text-foreground transition-colors">
          Catalog
        </Link>
        {product.categories && (
          <>
            <span className="text-border">/</span>
            <Link
              href={`${base}/catalog/${product.categories.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {getLocalizedField(product.categories, locale)}
            </Link>
          </>
        )}
        <span className="text-border">/</span>
        <span className="text-foreground font-medium truncate max-w-48">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Image gallery */}
        <div>
          <ProductImageGallery
            images={galleryImages}
            productName={name}
            locale={locale}
          />
        </div>

        {/* Product info */}
        <div>
          {/* Badges */}
          <div className="flex gap-2 mb-4">
            {product.is_new_arrival && (
              <Badge className="bg-foreground text-background text-xs font-medium">
                {ct('newArrival')}
              </Badge>
            )}
            {product.is_featured && (
              <Badge variant="outline" className="text-xs">
                {ct('featured')}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-2">{name}</h1>
          <p className="text-sm text-muted-foreground font-mono mb-6">
            {t('sku')}: {product.sku}
            {selectedVariant?.sku_suffix && selectedVariant.sku_suffix}
          </p>

          {/* Price and MOQ */}
          <div className="flex items-baseline gap-4 mb-6">
            <PriceBadge price={product.price} size="lg" />
            {product.moq > 1 && (
              <span className="text-sm text-muted-foreground">
                {t('moqNote', { moq: product.moq })}
              </span>
            )}
          </div>

          {/* Category */}
          {product.categories && (
            <div className="flex items-center gap-2 mb-6 text-sm">
              <span className="text-muted-foreground">{t('category')}:</span>
              <Link
                href={`${base}/catalog/${product.categories.slug}`}
                className="text-foreground hover:text-muted-foreground font-medium transition-colors"
              >
                {getLocalizedField(product.categories, locale)}
              </Link>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mb-6">
              <TagList tags={product.tags} />
            </div>
          )}

          <Separator className="my-8" />

          {/* Color variants */}
          {(product.product_variants?.length ?? 0) > 0 && (
            <>
              <div className="mb-6">
                <ColorVariantSelector
                  variants={product.product_variants as ProductVariantWithImages[]}
                  selectedVariantId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                />
              </div>
              <Separator className="my-8" />
            </>
          )}

          {/* Size variants */}
          {(product.product_sizes?.length ?? 0) > 0 && (
            <>
              <div className="mb-6">
                <SizeVariantSelector
                  sizes={product.product_sizes as ProductSize[]}
                  selectedSizeId={selectedSizeId}
                  onSelect={setSelectedSizeId}
                />
              </div>
              <Separator className="my-8" />
            </>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} selectedVariant={selectedVariant} selectedSize={selectedSize} />

          {/* Description */}
          {description && (
            <>
              <Separator className="my-8" />
              <div>
                <h2 className="text-sm font-medium text-foreground mb-3">
                  {t('description')}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
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
