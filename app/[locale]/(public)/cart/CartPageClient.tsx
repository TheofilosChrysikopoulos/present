'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import { ShoppingCart, FileDown } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { EnquiryForm } from '@/components/cart/EnquiryForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'

// Lazy-load PDF export to avoid SSR issues with @react-pdf/renderer
const CartPdfExport = dynamic(
  () => import('@/components/cart/CartPdfExport').then((m) => m.CartPdfExport),
  { ssr: false }
)

export function CartPageClient() {
  const locale = useLocale()
  const t = useTranslations('cart')
  const { items, clearCart, totalItems } = useCart()
  const base = locale === 'el' ? '/el' : ''

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-24">
        <EmptyState
          icon={<ShoppingCart className="h-20 w-20" />}
          title={t('empty')}
          description={t('emptyHint')}
          action={
            <Button asChild size="lg" className="mt-4">
              <Link href={`${base}/catalog`}>{t('browseCatalog')}</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          {t('title')}
          <span className="ml-3 text-lg font-normal text-muted-foreground">
            ({totalItems} {totalItems === 1 ? t('item') : t('items')})
          </span>
        </h1>
        <button
          onClick={() => {
            clearCart()
            toast.info(t('cartCleared'))
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('clearCart')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="px-5">
                <CartItemRow item={item} />
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="mt-6 flex items-center justify-between px-5 py-4 bg-secondary rounded-2xl">
            <span className="text-sm font-medium text-foreground">
              Estimated Total
            </span>
            <PriceBadge price={subtotal} size="lg" />
          </div>
        </div>

        {/* Sidebar: actions + enquiry form */}
        <div className="space-y-6">
          {/* Export PDF */}
          <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">{t('title')}</h2>
            <CartPdfExport />
          </div>

          {/* Enquiry form */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <EnquiryForm />
          </div>
        </div>
      </div>
    </div>
  )
}
