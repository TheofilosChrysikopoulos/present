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
      className="group block bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-md transition-all duration-200"
    >
      {/* Image container */}
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        {primaryImage ? (
          <Image
            src={getImageUrl(primaryImage.storage_path)}
            alt={
              (locale === 'el' ? primaryImage.alt_el : primaryImage.alt_en) ??
              name
            }
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <svg
              className="h-16 w-16"
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
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new_arrival && (
            <Badge className="bg-stone-900 text-white text-[10px] px-1.5 py-0.5 h-auto">
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
      <div className="p-3">
        <p className="text-[11px] text-stone-400 font-mono mb-0.5">{product.sku}</p>
        <h3 className="text-sm font-medium text-stone-900 line-clamp-2 leading-snug">
          {name}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <PriceBadge price={product.price} size="sm" />
          {product.moq > 1 && (
            <span className="text-[11px] text-stone-400">
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
                className="h-3.5 w-3.5 rounded-full border border-stone-200 flex-shrink-0"
                style={{ backgroundColor: v.hex_color ?? '#e7e5e4' }}
                title={locale === 'el' ? v.color_name_el : v.color_name_en}
              />
            ))}
            {(product.product_variants?.length ?? 0) > 4 && (
              <span className="text-[10px] text-stone-400">
                +{(product.product_variants?.length ?? 0) - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
