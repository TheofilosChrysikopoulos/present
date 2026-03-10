'use client'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { Lock, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PriceBadgeProps {
  price: number
  discountPrice?: number | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Skip the auth gate (useful in admin pages) */
  alwaysShow?: boolean
}

const fmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' })

export function PriceBadge({ price, discountPrice, className, size = 'md', alwaysShow = false }: PriceBadgeProps) {
  const { isApproved, isAuthenticated, loading } = useUser()
  const t = useTranslations('auth')

  if (!alwaysShow && !loading && !isApproved) {
    // Pending/authenticated but not approved — show pending message
    if (isAuthenticated) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-amber-500',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            className
          )}
        >
          <Clock className="h-3 w-3" />
          <span>{t('pendingPrice')}</span>
        </span>
      )
    }

    // Not authenticated at all
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
        <span>{t('loginToViewPrice')}</span>
      </span>
    )
  }

  const hasDiscount = discountPrice != null && discountPrice < price

  if (hasDiscount) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}>
        <span
          className={cn(
            'line-through text-slate-400 font-medium',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {fmt.format(price)}
        </span>
        <span
          className={cn(
            'font-semibold text-red-600',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-xl'
          )}
        >
          {fmt.format(discountPrice)}
        </span>
      </span>
    )
  }

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
      {fmt.format(price)}
    </span>
  )
}
