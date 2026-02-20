import { cn } from '@/lib/utils'

interface PriceBadgeProps {
  price: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceBadge({ price, className, size = 'md' }: PriceBadgeProps) {
  const formatted = new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)

  return (
    <span
      className={cn(
        'font-semibold text-foreground tabular-nums tracking-tight',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-2xl',
        className
      )}
    >
      {formatted}
    </span>
  )
}
