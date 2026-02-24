'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCart } from '@/hooks/useCart'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

export function CartIcon() {
  const { totalItems } = useCart()
  const { isApproved } = useUser()
  const locale = useLocale()
  const href = locale === 'en' ? '/en/cart' : '/cart'

  // Only show cart icon for approved users
  if (!isApproved) return null

  return (
    <Link
      href={href}
      className="relative flex items-center justify-center h-9 w-9 rounded-md text-[#1e3a5f]/70 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 transition-colors"
      aria-label={`Cart (${totalItems} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full',
            'bg-[#B13D82] text-white text-[10px] font-bold flex items-center justify-center',
            'leading-none tabular-nums'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
