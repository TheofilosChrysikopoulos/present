import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'el'],
  defaultLocale: 'el',
  // Greek at / (no prefix), English at /en/
  localePrefix: 'as-needed',
})
