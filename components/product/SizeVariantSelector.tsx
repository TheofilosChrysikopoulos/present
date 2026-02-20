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
      <p className="text-sm font-medium text-stone-700 mb-2">{t('sizes')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {sorted.map((size) => {
          const isSelected = selectedSizeId === size.id
          const label = locale === 'el' ? size.label_el : size.label_en

          return (
            <button
              key={size.id}
              onClick={() => onSelect(isSelected ? null : size.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                isSelected
                  ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                  : 'border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
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
        <p className="mt-1.5 text-xs text-stone-500">
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
