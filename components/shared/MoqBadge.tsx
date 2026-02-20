import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface MoqBadgeProps {
  moq: number
  className?: string
}

export function MoqBadge({ moq, className }: MoqBadgeProps) {
  const t = useTranslations('product')

  if (moq <= 1) return null

  return (
    <span
      className={cn(
        'text-xs text-stone-500 font-medium',
        className
      )}
    >
      {t('moqNote', { moq })}
    </span>
  )
}
