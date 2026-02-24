import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { getCategoryTree } from '@/lib/queries/categories'
import { CategoryMenu } from './CategoryMenu'
import { LanguageToggle } from './LanguageToggle'
import { CartIcon } from './CartIcon'
import { UserMenu } from './UserMenu'
import { MobileNav } from './MobileNav'

export async function Navbar() {
  const [locale, t, tree] = await Promise.all([
    getLocale(),
    getTranslations('nav'),
    getCategoryTree(),
  ])

  const homeHref = locale === 'en' ? '/en' : '/'

  return (
    <header className="sticky top-0 z-40 bg-[#EBFBFF] border-b border-[#1e3a5f]/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3 sm:gap-6">
          {/* Logo */}
          <Link
            href={homeHref}
            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2"
          >
            <Image
              src="/logo.png"
              alt="Present Accessories"
              width={36}
              height={36}
              className="h-8 w-auto sm:h-9"
              priority
            />
            <Image
              src="/present.png"
              alt="Present Accessories"
              width={140}
              height={36}
              className="hidden xs:block h-7 w-auto sm:h-8"
              priority
            />
          </Link>

          {/* Desktop category navigation */}
          <div className="flex-1 hidden lg:flex">
            <CategoryMenu tree={tree} variant="desktop" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
            <LanguageToggle />
            <UserMenu />
            <CartIcon />
            {/* Mobile menu trigger */}
            <MobileNav tree={tree} />
          </div>
        </div>
      </div>
    </header>
  )
}
