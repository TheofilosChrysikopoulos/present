import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { CartProvider } from '@/lib/cart/cartContext'
import { UserProvider } from '@/lib/auth/userContext'
import { Toaster } from '@/components/ui/sonner'
import '@/app/globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | Present Accessories',
    default: 'Present Accessories — Wholesale Tourist Products',
  },
  description:
    'Quality tourist and souvenir products for retailers and distributors. Based in Corfu, Greece.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'el')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <UserProvider>
            <CartProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </CartProvider>
          </UserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
