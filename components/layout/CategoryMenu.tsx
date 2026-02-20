'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { CategoryWithChildren } from '@/lib/types'
import { getLocalizedField } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryMenuProps {
  tree: CategoryWithChildren[]
  variant?: 'desktop' | 'mobile'
  onClose?: () => void
}

export function CategoryMenu({ tree, variant = 'desktop', onClose }: CategoryMenuProps) {
  const locale = useLocale()
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  function toggleExpand(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function getCategoryHref(slug: string) {
    const base = locale === 'el' ? '/el' : ''
    return `${base}/catalog/${slug}`
  }

  function isActive(slug: string) {
    return pathname.includes(`/catalog/${slug}`)
  }

  if (variant === 'mobile') {
    return (
      <nav className="flex flex-col gap-1">
        <Link
          href={locale === 'el' ? '/el/catalog' : '/catalog'}
          className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-xl transition-colors duration-200"
          onClick={onClose}
        >
          {t('allProducts')}
        </Link>
        {tree.map((cat) => (
          <MobileCategoryItem
            key={cat.id}
            cat={cat}
            locale={locale}
            getCategoryHref={getCategoryHref}
            isActive={isActive}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onClose={onClose}
          />
        ))}
      </nav>
    )
  }

  return (
    <nav className="hidden lg:flex items-center gap-1">
      <Link
        href={locale === 'el' ? '/el/catalog' : '/catalog'}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
          pathname.endsWith('/catalog') || pathname.endsWith('/catalog/')
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        {t('allProducts')}
      </Link>
      {tree.map((cat) => (
        <DesktopCategoryItem
          key={cat.id}
          cat={cat}
          locale={locale}
          getCategoryHref={getCategoryHref}
          isActive={isActive}
        />
      ))}
    </nav>
  )
}

function DesktopCategoryItem({
  cat,
  locale,
  getCategoryHref,
  isActive,
}: {
  cat: CategoryWithChildren
  locale: string
  getCategoryHref: (slug: string) => string
  isActive: (slug: string) => boolean
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = (cat.children?.length ?? 0) > 0

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={getCategoryHref(cat.slug)}
        className={cn(
          'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
          isActive(cat.slug)
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        {getLocalizedField(cat, locale)}
        {hasChildren && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
      </Link>

      {hasChildren && open && (
        <div className="absolute left-0 top-full pt-2 z-50">
          <div className="bg-white border border-border rounded-2xl shadow-xl py-2 min-w-48 animate-scale-in">
            {cat.children!.map((child) => (
              <Link
                key={child.id}
                href={getCategoryHref(child.slug)}
                className={cn(
                  'block px-4 py-2.5 text-sm transition-colors duration-200',
                  isActive(child.slug)
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {getLocalizedField(child, locale)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MobileCategoryItem({
  cat,
  locale,
  getCategoryHref,
  isActive,
  expandedIds,
  toggleExpand,
  onClose,
}: {
  cat: CategoryWithChildren
  locale: string
  getCategoryHref: (slug: string) => string
  isActive: (slug: string) => boolean
  expandedIds: string[]
  toggleExpand: (id: string) => void
  onClose?: () => void
}) {
  const hasChildren = (cat.children?.length ?? 0) > 0
  const isExpanded = expandedIds.includes(cat.id)

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={getCategoryHref(cat.slug)}
          className={cn(
            'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200',
            isActive(cat.slug)
              ? 'text-foreground bg-secondary'
              : 'text-foreground hover:bg-secondary'
          )}
          onClick={onClose}
        >
          {getLocalizedField(cat, locale)}
        </Link>
        {hasChildren && (
          <button
            onClick={() => toggleExpand(cat.id)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')}
            />
          </button>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 flex flex-col gap-1">
          {cat.children!.map((child) => (
            <Link
              key={child.id}
              href={getCategoryHref(child.slug)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors duration-200"
              onClick={onClose}
            >
              {getLocalizedField(child, locale)}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
