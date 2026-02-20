'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Mail,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function AdminSidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const base = locale === 'el' ? '/el' : ''

  const navItems = [
    {
      href: `${base}/admin`,
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `${base}/admin/products`,
      label: 'Products',
      icon: Package,
    },
    {
      href: `${base}/admin/categories`,
      label: 'Categories',
      icon: FolderTree,
    },
    {
      href: `${base}/admin/enquiries`,
      label: 'Enquiries',
      icon: Mail,
    },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`${base}/admin/login`)
    router.refresh()
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-stone-100">
        <Link href={`${base}/`} className="font-bold text-lg text-stone-900">
          ePresent
        </Link>
        <p className="text-xs text-stone-500 mt-0.5">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-stone-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  )
}
