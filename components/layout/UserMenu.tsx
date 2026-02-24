'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { User, LogIn, UserPlus, LogOut } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const base = locale === 'en' ? '/en' : ''
  const router = useRouter()
  const { customer, isAuthenticated, loading, logout } = useUser()

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-md bg-[#1e3a5f]/10 animate-pulse" />
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="h-9 text-sm gap-1.5 text-[#1e3a5f]/70 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10">
          <Link href={`${base}/auth/login`}>
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">{t('login')}</span>
          </Link>
        </Button>
        <Button asChild size="sm" className="h-9 text-sm gap-1.5 hidden sm:inline-flex bg-[#BFDBFE] hover:bg-[#93C5FD] text-[#1e3a5f] border-0">
          <Link href={`${base}/auth/register`}>
            <UserPlus className="h-4 w-4" />
            {t('register')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center h-9 w-9 rounded-md transition-colors',
            'text-[#1e3a5f]/70 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10',
            customer?.status === 'pending' && 'ring-2 ring-[#B13D82] ring-offset-1 ring-offset-[#EBFBFF]'
          )}
          aria-label="User menu"
        >
          <User className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-[#1e3a5f]">
            {customer?.first_name} {customer?.last_name}
          </p>
          <p className="text-xs text-slate-500 truncate">{customer?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${base}/account`} className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            {t('myAccount')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await logout()
            router.push(`${base}/`)
            router.refresh()
          }}
          className="flex items-center gap-2 cursor-pointer text-slate-500"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
