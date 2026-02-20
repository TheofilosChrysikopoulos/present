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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-900">{t('filters')}</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-stone-500 text-xs h-7 px-2 gap-1"
          >
            <X className="h-3 w-3" />
            {t('clearFilters')}
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          {t('categories')}
        </h3>
        <div className="space-y-0.5">
          <Link
            href={`${base}/catalog`}
            className={cn(
              'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
              !currentCategorySlug
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
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

      <Separator className="my-4" />

      {/* Active tag filters */}
      {activeTags.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Active Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {activeTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-stone-900 text-white text-xs font-medium"
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
    <div style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : undefined }}>
      <Link
        href={`${base}/catalog/${cat.slug}`}
        className={cn(
          'flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-stone-900 text-white'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        <span>{getLocalizedField(cat, locale)}</span>
        {hasChildren && <ChevronRight className="h-3 w-3 opacity-50" />}
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
