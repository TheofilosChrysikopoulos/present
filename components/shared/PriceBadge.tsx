'use client'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { Lock } from 'lucide-react'

interface PriceBadgeProps {
  price: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Skip the auth gate (useful in admin pages) */
  alwaysShow?: boolean
}

export function PriceBadge({ price, className, size = 'md', alwaysShow = false }: PriceBadgeProps) {
  const { isApproved, loading } = useUser()

  if (!alwaysShow && !loading && !isApproved) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-slate-400',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          className
        )}
      >
        <Lock className="h-3 w-3" />
        <span>Login to view</span>
      </span>
    )
  }

  const formatted = new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)

  return (
    <span
      className={cn(
        'font-semibold text-[#1e3a5f] tabular-nums',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-xl',
        className
      )}
    >
      {formatted}
    </span>
  )
}
