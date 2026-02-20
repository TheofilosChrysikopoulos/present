'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

export function CartIcon() {
  const { totalItems } = useCart()
  const locale = useLocale()
  const href = locale === 'el' ? '/el/cart' : '/cart'

  return (
    <Link
      href={href}
      className="relative flex items-center justify-center h-9 w-9 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
      aria-label={`Cart (${totalItems} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full',
            'bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center',
            'leading-none tabular-nums'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
