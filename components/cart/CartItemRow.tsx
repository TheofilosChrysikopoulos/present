'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/hooks/useCart'
import { PriceBadge } from '@/components/shared/PriceBadge'
import type { CartItem } from '@/lib/cart/cartTypes'
import { cn } from '@/lib/utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

interface CartItemRowProps {
  item: CartItem
  compact?: boolean
}

export function CartItemRow({ item, compact = false }: CartItemRowProps) {
  const locale = useLocale()
  const t = useTranslations('cart')
  const { updateQty, removeItem } = useCart()

  const name = locale === 'el' ? item.nameEl : item.nameEn
  const colorName = item.variant
    ? locale === 'el'
      ? item.variant.colorNameEl
      : item.variant.colorNameEn
    : null
  const sizeName = item.size
    ? locale === 'el'
      ? item.size.labelEl
      : item.size.labelEn
    : null

  const productHref = locale === 'el'
    ? `/el/product/${item.sku.split('-')[0]}`
    : `/product/${item.sku.split('-')[0]}`

  return (
    <div className={cn('flex gap-4', compact ? 'py-3' : 'py-5')}>
      {/* Image */}
      <div className={cn('relative flex-shrink-0 rounded-xl overflow-hidden bg-secondary',
        compact ? 'h-14 w-14' : 'h-20 w-20')}>
        {item.primaryImagePath ? (
          <Image
            src={imgUrl(item.primaryImagePath)}
            alt={name}
            fill
            sizes={compact ? '56px' : '80px'}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
              {name}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</p>
            {colorName && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {item.variant?.hexColor && (
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: item.variant.hexColor }}
                  />
                )}
                <span className="text-xs text-muted-foreground">{colorName}</span>
              </div>
            )}
            {sizeName && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-muted-foreground">{sizeName}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('remove')}
          >
            <X className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          </button>
        </div>

        {!compact && (
          <div className="mt-3 flex items-center justify-between">
            {/* Qty stepper */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQty(item.id, item.qty - 1)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                aria-label="Decrease"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, item.qty + 1)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                aria-label="Increase"
              >
                <Plus className="h-3 w-3" />
              </button>
              {item.moq > 1 && (
                <span className="text-xs text-muted-foreground ml-1">min {item.moq}</span>
              )}
            </div>

            <PriceBadge price={item.price * item.qty} size="sm" />
          </div>
        )}

        {compact && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('qty')}: {item.qty} × <PriceBadge price={item.price} size="sm" />
          </p>
        )}
      </div>
    </div>
  )
}
