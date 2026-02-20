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
      className="text-muted-foreground hover:text-foreground font-medium text-sm gap-1 px-3 h-10 rounded-xl"
      aria-label={locale === 'en' ? 'Switch to Greek' : 'Switch to English'}
    >
      <span className={locale === 'en' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        EN
      </span>
      <span className="text-border">/</span>
      <span className={locale === 'el' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        EL
      </span>
    </Button>
  )
}
