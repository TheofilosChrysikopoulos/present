'use client'

import { useLocale } from 'next-intl'
import { useUser } from '@/hooks/useUser'
import { useAuthModal } from '@/lib/auth/authModalContext'

export function FooterAuthLinks() {
  const locale = useLocale()
  const { isAuthenticated, loading } = useUser()
  const { openLogin, openRegister } = useAuthModal()

  // Hide login/register links when loading or when user is authenticated
  if (loading || isAuthenticated) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <button onClick={openLogin} className="text-xs text-[#1e3a5f]/40 hover:text-[#B13D82] transition-colors">
        {locale === 'el' ? 'Σύνδεση' : 'Login'}
      </button>
      <button onClick={openRegister} className="text-xs text-[#1e3a5f]/40 hover:text-[#B13D82] transition-colors">
        {locale === 'el' ? 'Εγγραφή' : 'Register'}
      </button>
    </div>
  )
}
