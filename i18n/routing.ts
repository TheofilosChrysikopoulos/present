import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['el', 'en'],
  defaultLocale: 'el',
  // Both locales always show prefix: /el/... and /en/...
  localePrefix: 'always',
  // Disable Accept-Language detection so users always land on Greek by default
  localeDetection: false,
})
