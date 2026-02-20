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
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            'text-xs font-normal text-muted-foreground bg-secondary border-transparent',
            onTagClick && 'cursor-pointer hover:bg-secondary/80 transition-colors'
          )}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
