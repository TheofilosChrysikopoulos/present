import Link from 'next/link'
import { Menu } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { getCategoryTree } from '@/lib/queries/categories'
import { CategoryMenu } from './CategoryMenu'
import { LanguageToggle } from './LanguageToggle'
import { CartIcon } from './CartIcon'
import { MobileNav } from './MobileNav'

export async function Navbar() {
  const [locale, t, tree] = await Promise.all([
    getLocale(),
    getTranslations('nav'),
    getCategoryTree(),
  ])

  const homeHref = locale === 'el' ? '/el' : '/'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link
            href={homeHref}
            className="flex-shrink-0 font-bold text-xl tracking-tight text-stone-900"
          >
            ePresent
          </Link>

          {/* Desktop category navigation */}
          <div className="flex-1 hidden lg:flex">
            <CategoryMenu tree={tree} variant="desktop" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            <LanguageToggle />
            <CartIcon />
            {/* Mobile menu trigger */}
            <MobileNav tree={tree} />
          </div>
        </div>
      </div>
    </header>
  )
}
