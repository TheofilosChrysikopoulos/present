'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { User, Package, LogOut, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceBadge } from '@/components/shared/PriceBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Order } from '@/lib/types'

export default function AccountPage() {
  const t = useTranslations('account')
  const locale = useLocale()
  const base = `/${locale}`
  const router = useRouter()
  const { customer, loading, isAuthenticated, logout } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`${base}/auth/login`)
    }
  }, [loading, isAuthenticated, router, base])

  useEffect(() => {
    if (customer) {
      setOrdersLoading(true)
      fetch('/api/auth/orders')
        .then((res) => res.json())
        .then((data) => setOrders(data.orders ?? []))
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false))
    }
  }, [customer])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!customer) return null

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: t('statusPending') },
    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: t('statusApproved') },
    rejected: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: t('statusRejected') },
  }

  const statusInfo = statusConfig[customer.status]
  const StatusIcon = statusInfo.icon

  const orderStatusLabels: Record<string, string> = {
    pending: t('orderPending'),
    confirmed: t('orderConfirmed'),
    processing: t('orderProcessing'),
    shipped: t('orderShipped'),
    completed: t('orderCompleted'),
    cancelled: t('orderCancelled'),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="h-7 w-7 text-slate-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1e3a5f]">
                {customer.first_name} {customer.last_name}
              </h1>
              <p className="text-sm text-slate-500">{customer.email}</p>
              <p className="text-sm text-slate-400">{customer.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout()
                router.push(`${base}/`)
              }}
              className="gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('logout')}
            </Button>
          </div>
        </div>

        {customer.status === 'pending' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{t('pendingMessage')}</p>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-[#1e3a5f]">{t('orders')}</h2>
          </div>
        </div>

        {ordersLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t('noOrders')}</p>
            {customer.status === 'approved' && (
              <Button asChild variant="outline" className="mt-3">
                <Link href={`${base}/catalog`}>{t('browseCatalog')}</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-medium text-[#1e3a5f]">
                      #{order.order_number}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {orderStatusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <PriceBadge price={order.total_amount} size="sm" />
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString(
                        locale === 'el' ? 'el-GR' : 'en-GB'
                      )}
                    </p>
                  </div>
                </div>

                {/* Order items summary */}
                <div className="space-y-1">
                  {(order.items as any[]).slice(0, 3).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm text-slate-600"
                    >
                      <span className="truncate max-w-[60%]">
                        {locale === 'el' ? item.name_el : item.name_en}
                      </span>
                      <span className="text-slate-400">
                        ×{item.qty}
                      </span>
                    </div>
                  ))}
                  {(order.items as any[]).length > 3 && (
                    <p className="text-xs text-slate-400">
                      +{(order.items as any[]).length - 3} {t('moreItems')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
