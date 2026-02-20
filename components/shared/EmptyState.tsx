import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-6 text-muted-foreground/30">{icon}</div>
      )}
      <h3 className="text-xl font-semibold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
