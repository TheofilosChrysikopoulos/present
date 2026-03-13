'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, Grid3X3 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { CategoryWithChildren } from '@/lib/types'
import { getLocalizedField } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryMenuProps {
  tree: CategoryWithChildren[]
  variant?: 'desktop' | 'mobile'
  showSubcategories?: boolean
  onClose?: () => void
}

export function CategoryMenu({ tree, variant = 'desktop', showSubcategories = true, onClose }: CategoryMenuProps) {
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
    return `/${locale}/catalog/${slug}`
  }

  function isActive(slug: string) {
    return pathname.includes(`/catalog/${slug}`)
  }

  if (variant === 'mobile') {
    return (
      <nav className="flex flex-col gap-1">
        <Link
          href={`/${locale}/catalog`}
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
            showSubcategories={showSubcategories}
            onClose={onClose}
          />
        ))}
      </nav>
    )
  }

  return <DesktopCategoryDropdown tree={tree} locale={locale} t={t} pathname={pathname} getCategoryHref={getCategoryHref} isActive={isActive} />
}

function DesktopCategoryDropdown({
  tree,
  locale,
  t,
  pathname,
  getCategoryHref,
  isActive,
}: {
  tree: CategoryWithChildren[]
  locale: string
  t: ReturnType<typeof useTranslations<'nav'>>
  pathname: string
  getCategoryHref: (slug: string) => string
  isActive: (slug: string) => boolean
}) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isCatalogActive = pathname.includes('/catalog')

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  return (
    <nav className="hidden lg:flex items-center gap-1">
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="flex items-center">
          <Link
            href={`/${locale}/catalog`}
            className={cn(
              'flex items-center gap-1.5 pl-3 pr-1 py-2 text-sm font-medium rounded-l-md transition-colors',
              isCatalogActive
                ? 'text-[#1e3a5f] bg-[#1e3a5f]/10'
                : 'text-[#1e3a5f]/70 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/5'
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            {t('catalog')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'flex items-center justify-center pr-2 pl-1 self-stretch text-sm font-medium rounded-r-md transition-colors',
              isCatalogActive
                ? 'text-[#1e3a5f] bg-[#1e3a5f]/10'
                : 'text-[#1e3a5f]/70 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/5'
            )}
            aria-label="Toggle catalog menu"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        {open && (
          <div className="absolute left-0 top-full pt-1 z-50">
            <div className="bg-white border border-stone-200 rounded-xl shadow-xl p-4 min-w-[480px] max-w-[640px]">
              {/* "All Products" link at top */}
              <Link
                href={`/${locale}/catalog`}
                className={cn(
                  'block px-3 py-2 text-sm font-semibold rounded-md transition-colors mb-2',
                  pathname.endsWith('/catalog') || pathname.endsWith('/catalog/')
                    ? 'text-[#1e3a5f] bg-[#1e3a5f]/10'
                    : 'text-[#1e3a5f] hover:bg-[#1e3a5f]/5'
                )}
              >
                {t('allProducts')}
              </Link>

              <div className="border-t border-stone-100 pt-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 max-h-[60vh] overflow-y-auto">
                  {tree.map((cat) => (
                    <div key={cat.id} className="mb-2">
                      <Link
                        href={getCategoryHref(cat.slug)}
                        className={cn(
                          'block px-2 py-1.5 text-sm font-semibold rounded-md transition-colors',
                          isActive(cat.slug)
                            ? 'text-[#1e3a5f] bg-[#1e3a5f]/10'
                            : 'text-[#1e3a5f] hover:bg-[#1e3a5f]/5'
                        )}
                      >
                        {getLocalizedField(cat, locale)}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function MobileCategoryItem({
  cat,
  locale,
  getCategoryHref,
  isActive,
  expandedIds,
  toggleExpand,
  showSubcategories = true,
  onClose,
}: {
  cat: CategoryWithChildren
  locale: string
  getCategoryHref: (slug: string) => string
  isActive: (slug: string) => boolean
  expandedIds: string[]
  toggleExpand: (id: string) => void
  showSubcategories?: boolean
  onClose?: () => void
}) {
  const hasChildren = showSubcategories && (cat.children?.length ?? 0) > 0
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
