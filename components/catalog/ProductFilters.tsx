'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { CategoryWithChildren } from '@/lib/types'
import { getLocalizedField } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProductFiltersProps {
  tree: CategoryWithChildren[]
  currentCategorySlug?: string
}

export function ProductFilters({ tree, currentCategorySlug }: ProductFiltersProps) {
  const t = useTranslations('catalog')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const base = locale === 'el' ? '/el' : ''

  const hasFilters =
    searchParams.has('q') ||
    searchParams.has('tag') ||
    searchParams.has('minPrice') ||
    searchParams.has('maxPrice') ||
    currentCategorySlug

  function clearFilters() {
    router.push(`${base}/catalog`)
  }

  function toggleTag(tag: string) {
    const params = new URLSearchParams(searchParams)
    const currentTags = params.getAll('tag')
    if (currentTags.includes(tag)) {
      // Remove tag
      params.delete('tag')
      currentTags.filter((t) => t !== tag).forEach((t) => params.append('tag', t))
    } else {
      params.append('tag', tag)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const activeTags = searchParams.getAll('tag')

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-foreground tracking-tight">{t('filters')}</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground text-xs h-7 px-2 gap-1 hover:text-foreground"
          >
            <X className="h-3 w-3" />
            {t('clearFilters')}
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {t('categories')}
        </h3>
        <div className="space-y-1">
          <Link
            href={`${base}/catalog`}
            className={cn(
              'flex items-center px-3 py-2 rounded-xl text-sm transition-all duration-200',
              !currentCategorySlug
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {t('allCategories')}
          </Link>
          {tree.map((cat) => (
            <CategoryFilterItem
              key={cat.id}
              cat={cat}
              locale={locale}
              base={base}
              currentSlug={currentCategorySlug}
              depth={0}
            />
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Active tag filters */}
      {activeTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Active Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium transition-opacity hover:opacity-80"
              >
                {tag}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

function CategoryFilterItem({
  cat,
  locale,
  base,
  currentSlug,
  depth,
}: {
  cat: CategoryWithChildren
  locale: string
  base: string
  currentSlug?: string
  depth: number
}) {
  const isActive = currentSlug === cat.slug
  const hasChildren = (cat.children?.length ?? 0) > 0

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 14}px` : undefined }}>
      <Link
        href={`${base}/catalog/${cat.slug}`}
        className={cn(
          'flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200',
          isActive
            ? 'bg-foreground text-background font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        <span>{getLocalizedField(cat, locale)}</span>
        {hasChildren && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
      </Link>
      {hasChildren &&
        cat.children!.map((child) => (
          <CategoryFilterItem
            key={child.id}
            cat={child}
            locale={locale}
            base={base}
            currentSlug={currentSlug}
            depth={depth + 1}
          />
        ))}
    </div>
  )
}
