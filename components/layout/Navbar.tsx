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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center h-20 gap-8">
          {/* Logo */}
          <Link
            href={homeHref}
            className="flex-shrink-0 text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-muted-foreground"
          >
            ePresent
          </Link>

          {/* Desktop category navigation */}
          <div className="flex-1 hidden lg:flex">
            <CategoryMenu tree={tree} variant="desktop" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
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
