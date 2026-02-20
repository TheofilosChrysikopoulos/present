import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagListProps {
  tags: string[]
  className?: string
  onTagClick?: (tag: string) => void
}

export function TagList({ tags, className, onTagClick }: TagListProps) {
  if (!tags.length) return null

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            'text-xs font-normal text-stone-600 bg-stone-100 border-stone-200',
            onTagClick && 'cursor-pointer hover:bg-stone-200 transition-colors'
          )}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
