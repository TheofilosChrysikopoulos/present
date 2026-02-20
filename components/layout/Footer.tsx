import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

export async function Footer() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('nav')])
  const base = locale === 'el' ? '/el' : ''

  return (
    <footer className="border-t border-stone-200 bg-stone-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-stone-900 text-lg mb-2">ePresent</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Wholesale tourist products for retailers and distributors across Greece and Europe.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wide">
              Catalog
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`${base}/catalog`}
                  className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/catalog?featured=true`}
                  className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Featured
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/catalog?new=true`}
                  className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-stone-700 mb-3 text-sm uppercase tracking-wide">
              Business
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`${base}/cart`}
                  className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Your Selection
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-stone-200 text-xs text-stone-400">
          © {new Date().getFullYear()} ePresent. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
