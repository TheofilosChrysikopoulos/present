'use client'

import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ProductSize } from '@/lib/types'

interface SizeVariantSelectorProps {
  sizes: ProductSize[]
  selectedSizeId: string | null
  onSelect: (sizeId: string | null) => void
}

export function SizeVariantSelector({
  sizes,
  selectedSizeId,
  onSelect,
}: SizeVariantSelectorProps) {
  const locale = useLocale()
  const t = useTranslations('product')

  if (!sizes.length) return null

  const sorted = [...sizes].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">{t('sizes')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {sorted.map((size) => {
          const isSelected = selectedSizeId === size.id
          const label = locale === 'el' ? size.label_el : size.label_en

          return (
            <button
              key={size.id}
              onClick={() => onSelect(isSelected ? null : size.id)}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-foreground hover:border-muted-foreground hover:bg-secondary'
              )}
              aria-pressed={isSelected}
              aria-label={label}
            >
              {label}
            </button>
          )
        })}
      </div>

      {selectedSizeId && (
        <p className="mt-2 text-sm text-muted-foreground">
          {sorted.find((s) => s.id === selectedSizeId)
            ? locale === 'el'
              ? sorted.find((s) => s.id === selectedSizeId)!.label_el
              : sorted.find((s) => s.id === selectedSizeId)!.label_en
            : ''}
        </p>
      )}
    </div>
  )
}
