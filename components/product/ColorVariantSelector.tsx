'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ProductVariantWithImages } from '@/lib/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

interface ColorVariantSelectorProps {
  variants: ProductVariantWithImages[]
  selectedVariantId: string | null
  onSelect: (variantId: string | null) => void
}

export function ColorVariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: ColorVariantSelectorProps) {
  const locale = useLocale()
  const t = useTranslations('product')

  if (!variants.length) return null

  const sorted = [...variants].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">{t('colors')}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {/* "No variant" option to reset to base product */}
        {sorted.map((variant) => {
          const isSelected = selectedVariantId === variant.id
          const colorName =
            locale === 'el' ? variant.color_name_el : variant.color_name_en
          const primaryVariantImage = variant.variant_images
            ?.sort((a, b) => a.sort_order - b.sort_order)
            .find((i) => i.is_primary) ?? variant.variant_images?.[0]

          if (variant.variant_type === 'image' && primaryVariantImage) {
            return (
              <button
                key={variant.id}
                onClick={() => onSelect(isSelected ? null : variant.id)}
                title={colorName}
                className={cn(
                  'relative h-14 w-14 rounded-xl overflow-hidden transition-all duration-200',
                  isSelected
                    ? 'ring-2 ring-foreground ring-offset-2 scale-105'
                    : 'ring-1 ring-border hover:ring-muted-foreground'
                )}
              >
                <Image
                  src={imgUrl(primaryVariantImage.storage_path)}
                  alt={colorName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
            )
          }

          // Swatch variant
          return (
            <button
              key={variant.id}
              onClick={() => onSelect(isSelected ? null : variant.id)}
              title={colorName}
              className={cn(
                'h-9 w-9 rounded-full transition-all duration-200 flex-shrink-0',
                isSelected
                  ? 'ring-2 ring-foreground ring-offset-2 scale-110'
                  : 'ring-1 ring-border hover:ring-muted-foreground hover:scale-105'
              )}
              style={{ backgroundColor: variant.hex_color ?? '#e5e5e5' }}
              aria-pressed={isSelected}
              aria-label={colorName}
            />
          )
        })}
      </div>

      {selectedVariantId && (
        <p className="mt-2 text-sm text-muted-foreground">
          {sorted.find((v) => v.id === selectedVariantId)
            ? locale === 'el'
              ? sorted.find((v) => v.id === selectedVariantId)!.color_name_el
              : sorted.find((v) => v.id === selectedVariantId)!.color_name_en
            : ''}
        </p>
      )}
    </div>
  )
}
