import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { Phone, Mail, Facebook } from 'lucide-react'

export async function Footer() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('nav')])
  const base = `/${locale}`

  return (
    <footer className="bg-[#EBFBFF] text-[#1e3a5f] mt-auto border-t border-[#1e3a5f]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/logo.png"
                alt="Present Accessories"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <Image
                src="/present.png"
                alt="Present Accessories"
                width={120}
                height={32}
                className="h-7 w-auto"
              />
            </div>
            <p className="text-sm text-[#1e3a5f]/60 leading-relaxed">
              {locale === 'el'
                ? 'Εισαγωγή και χονδρική πώληση τουριστικών ειδών και ειδών θαλάσσης από την Κέρκυρα.'
                : 'Import and wholesale of tourist products and beach accessories from Corfu, Greece.'}
            </p>
          </div>

          {/* Catalog links */}
          <div>
            <p className="font-semibold text-[#1e3a5f] mb-3 text-sm uppercase tracking-wide">
              {locale === 'el' ? 'Κατάλογος' : 'Catalog'}
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`${base}/catalog`}
                  className="text-sm text-[#1e3a5f]/60 hover:text-[#B13D82] transition-colors"
                >
                  {locale === 'el' ? 'Όλα τα Προϊόντα' : 'All Products'}
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/catalog?featured=true`}
                  className="text-sm text-[#1e3a5f]/60 hover:text-[#B13D82] transition-colors"
                >
                  {locale === 'el' ? 'Προτεινόμενα' : 'Featured'}
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/catalog?new=true`}
                  className="text-sm text-[#1e3a5f]/60 hover:text-[#B13D82] transition-colors"
                >
                  {locale === 'el' ? 'Νέες Αφίξεις' : 'New Arrivals'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <p className="font-semibold text-[#1e3a5f] mb-3 text-sm uppercase tracking-wide">
              {locale === 'el' ? 'Πληροφορίες' : 'Contact'}
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-[#1e3a5f]/60">
                <Phone className="h-4 w-4 text-[#B13D82] flex-shrink-0" />
                <span>26610 47265</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1e3a5f]/60">
                <Phone className="h-4 w-4 text-[#B13D82] flex-shrink-0" />
                <span>26610 46584</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1e3a5f]/60">
                <Mail className="h-4 w-4 text-[#B13D82] flex-shrink-0" />
                <a href="mailto:present.summerfashion@gmail.com" className="hover:text-[#B13D82] transition-colors">
                  present.summerfashion@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social / Business */}
          <div>
            <p className="font-semibold text-[#1e3a5f] mb-3 text-sm uppercase tracking-wide">
              {locale === 'el' ? 'Ακολουθήστε μας' : 'Follow Us'}
            </p>
            <a
              href="https://www.facebook.com/presentcorfu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#1e3a5f]/60 hover:text-[#B13D82] transition-colors"
            >
              <Facebook className="h-4 w-4" />
              Present Corfu
            </a>
            <p className="mt-4 text-xs text-[#1e3a5f]/40">
              Χρυσικόπουλος Παναγιώτης
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#1e3a5f]/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#1e3a5f]/40">
            © {new Date().getFullYear()} Present Accessories. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href={`${base}/auth/login`} className="text-xs text-[#1e3a5f]/40 hover:text-[#B13D82] transition-colors">
              {locale === 'el' ? 'Σύνδεση' : 'Login'}
            </Link>
            <Link href={`${base}/auth/register`} className="text-xs text-[#1e3a5f]/40 hover:text-[#B13D82] transition-colors">
              {locale === 'el' ? 'Εγγραφή' : 'Register'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
