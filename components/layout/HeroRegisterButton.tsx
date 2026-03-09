'use client'

import { useUser } from '@/hooks/useUser'
import { useAuthModal } from '@/lib/auth/authModalContext'
import { Button } from '@/components/ui/button'

interface HeroRegisterButtonProps {
  label: string
}

export function HeroRegisterButton({ label }: HeroRegisterButtonProps) {
  const { isAuthenticated, loading } = useUser()
  const { openRegister } = useAuthModal()

  if (loading || isAuthenticated) {
    return null
  }

  return (
    <Button onClick={openRegister} size="lg" variant="outline" className="gap-2 font-semibold bg-white/90 border-white text-[#1e3a5f] hover:bg-transparent hover:text-white hover:border-white/60 transition-all">
      {label}
    </Button>
  )
}
