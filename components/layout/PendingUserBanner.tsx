'use client'

import { useUser } from '@/hooks/useUser'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

export function PendingUserBanner() {
  const { customer, isAuthenticated, loading } = useUser()
  const t = useTranslations('auth')

  if (loading || !isAuthenticated || customer?.status !== 'pending') {
    return null
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-2 justify-center text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            {t('pendingBanner')}
          </p>
        </div>
      </div>
    </div>
  )
}
