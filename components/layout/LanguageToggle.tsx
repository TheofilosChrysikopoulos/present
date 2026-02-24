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

    // Swap locale prefix in path: /el/... ↔ /en/...
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`)
    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="text-[#1e3a5f]/70 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 font-medium text-sm gap-1 px-2"
      aria-label={locale === 'en' ? 'Switch to Greek' : 'Switch to English'}
    >
      <span className={locale === 'en' ? 'font-bold text-[#1e3a5f]' : 'text-[#1e3a5f]/40'}>
        EN
      </span>
      <span className="text-[#1e3a5f]/30">/</span>
      <span className={locale === 'el' ? 'font-bold text-[#1e3a5f]' : 'text-[#1e3a5f]/40'}>
        EL
      </span>
    </Button>
  )
}
