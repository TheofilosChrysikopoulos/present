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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          icon={<ShoppingCart className="h-16 w-16" />}
          title={t('empty')}
          description={t('emptyHint')}
          action={
            <Button asChild>
              <Link href={`${base}/catalog`}>{t('browseCatalog')}</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">
          {t('title')}
          <span className="ml-2 text-base font-normal text-stone-400">
            ({totalItems} {totalItems === 1 ? t('item') : t('items')})
          </span>
        </h1>
        <button
          onClick={() => {
            clearCart()
            toast.info(t('cartCleared'))
          }}
          className="text-sm text-stone-500 hover:text-stone-700 underline"
        >
          {t('clearCart')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.id} className="px-4">
                <CartItemRow item={item} />
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="mt-4 flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-sm font-medium text-stone-700">
              Estimated Total
            </span>
            <PriceBadge price={subtotal} size="lg" />
          </div>
        </div>

        {/* Sidebar: actions + enquiry form */}
        <div className="space-y-4">
          {/* Export PDF */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-stone-900">{t('title')}</h2>
            <CartPdfExport />
          </div>

          {/* Enquiry form */}
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <EnquiryForm />
          </div>
        </div>
      </div>
    </div>
  )
}
