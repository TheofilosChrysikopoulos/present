import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'el'],
  defaultLocale: 'en',
  // English at / (no prefix), Greek at /el/
  localePrefix: 'as-needed',
})
