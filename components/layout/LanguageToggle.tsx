'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function toggle() {
    const nextLocale = locale === 'en' ? 'el' : 'en'

    // Swap locale prefix in path
    // English routes: /catalog → /el/catalog
    // Greek routes: /el/catalog → /catalog
    let newPath: string
    if (locale === 'en') {
      newPath = `/el${pathname}`
    } else {
      // Strip /el prefix
      newPath = pathname.replace(/^\/el/, '') || '/'
    }
    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="text-stone-600 hover:text-stone-900 font-medium text-sm gap-1 px-2"
      aria-label={locale === 'en' ? 'Switch to Greek' : 'Switch to English'}
    >
      <span className={locale === 'en' ? 'font-bold text-stone-900' : 'text-stone-400'}>
        EN
      </span>
      <span className="text-stone-300">/</span>
      <span className={locale === 'el' ? 'font-bold text-stone-900' : 'text-stone-400'}>
        EL
      </span>
    </Button>
  )
}
