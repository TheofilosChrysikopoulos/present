import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

export async function Footer() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('nav')])
  const base = locale === 'el' ? '/el' : ''

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <p className="font-semibold text-foreground text-xl tracking-tight mb-4">ePresent</p>
            <p className="text-muted-foreground leading-relaxed max-w-xs">
              Wholesale tourist products for retailers and distributors across Greece and Europe.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-4 text-xs uppercase tracking-wider">
              Catalog
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`${base}/catalog`}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/catalog?featured=true`}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Featured
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/catalog?new=true`}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-4 text-xs uppercase tracking-wider">
              Business
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`${base}/cart`}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Your Selection
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
          © {new Date().getFullYear()} ePresent. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
