'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { getLocalizedField } from '@/lib/types'
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function getImageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale()
  const t = useTranslations('product')
  const ct = useTranslations('common')

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0]

  const name = locale === 'el' ? product.name_el : product.name_en
  const href = locale === 'el' ? `/el/product/${product.sku}` : `/product/${product.sku}`

  // Show up to 4 color swatches
  const swatches = product.product_variants?.slice(0, 4) ?? []

  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl border border-border overflow-hidden hover:border-muted-foreground/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
        {primaryImage ? (
          <Image
            src={getImageUrl(primaryImage.storage_path)}
            alt={
              (locale === 'el' ? primaryImage.alt_el : primaryImage.alt_en) ??
              name
            }
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <svg
              className="h-20 w-20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && (
            <Badge className="bg-foreground text-background text-[10px] px-2 py-0.5 h-auto font-medium">
              {ct('newArrival')}
            </Badge>
          )}
          {product.is_featured && (
            <Badge
              variant="outline"
              className="bg-white/90 backdrop-blur text-[10px] px-2 py-0.5 h-auto"
            >
              {ct('featured')}
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <p className="text-xs text-muted-foreground font-mono mb-1.5">{product.sku}</p>
        <h3 className="text-[15px] font-medium text-foreground line-clamp-2 leading-snug tracking-tight">
          {name}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2">
          <PriceBadge price={product.price} size="sm" />
          {product.moq > 1 && (
            <span className="text-xs text-muted-foreground">
              {t('moqNote', { moq: product.moq })}
            </span>
          )}
        </div>

        {/* Color swatches */}
        {swatches.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {swatches.map((v) => (
              <span
                key={v.id}
                className="h-4 w-4 rounded-full border border-border flex-shrink-0 transition-transform hover:scale-110"
                style={{ backgroundColor: v.hex_color ?? '#e5e5e5' }}
                title={locale === 'el' ? v.color_name_el : v.color_name_en}
              />
            ))}
            {(product.product_variants?.length ?? 0) > 4 && (
              <span className="text-xs text-muted-foreground">
                +{(product.product_variants?.length ?? 0) - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
