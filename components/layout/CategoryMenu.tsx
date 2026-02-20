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
          className="px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md"
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
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          pathname.endsWith('/catalog') || pathname.endsWith('/catalog/')
            ? 'text-stone-900 bg-stone-100'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
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
          'flex items-center gap-0.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          isActive(cat.slug)
            ? 'text-stone-900 bg-stone-100'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
        )}
      >
        {getLocalizedField(cat, locale)}
        {hasChildren && <ChevronDown className="h-3 w-3 opacity-50" />}
      </Link>

      {hasChildren && open && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-40">
            {cat.children!.map((child) => (
              <Link
                key={child.id}
                href={getCategoryHref(child.slug)}
                className={cn(
                  'block px-4 py-2 text-sm transition-colors',
                  isActive(child.slug)
                    ? 'text-stone-900 bg-stone-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
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
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isActive(cat.slug)
              ? 'text-stone-900 bg-stone-100'
              : 'text-stone-700 hover:bg-stone-100'
          )}
          onClick={onClose}
        >
          {getLocalizedField(cat, locale)}
        </Link>
        {hasChildren && (
          <button
            onClick={() => toggleExpand(cat.id)}
            className="p-2 text-stone-500"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
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
              className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-md"
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
