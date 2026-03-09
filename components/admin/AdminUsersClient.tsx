'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MapPin,
  Mail,
  Package,
  Calendar,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CustomerWithStats } from '@/lib/types'

interface AdminUsersClientProps {
  initialCustomers: CustomerWithStats[]
  total: number
  page: number
  totalPages: number
  stats: { total: number; pending: number; approved: number }
  currentFilters: {
    status?: string
    region?: string
    search?: string
    sortBy?: string
  }
}

export function AdminUsersClient({
  initialCustomers,
  total,
  page,
  totalPages,
  stats,
  currentFilters,
}: AdminUsersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParams({ search: value || undefined })
  }, 300)

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    // Reset page when changing filters
    if (!updates.page) {
      params.delete('page')
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  async function handleStatusChange(customerId: string, newStatus: 'approved' | 'rejected') {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Update failed')

      toast.success(newStatus === 'approved' ? 'Customer approved' : 'Customer rejected')
      router.refresh()
    } catch {
      toast.error('Failed to update customer status')
    }
  }

  async function handleDelete(customerId: string) {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('User deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete user')
    }
  }

  async function handleRegionChange(customerId: string, newRegion: 'corfu' | 'greece') {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: newRegion }),
      })

      if (!res.ok) throw new Error('Update failed')

      toast.success('Region updated')
      router.refresh()
    } catch {
      toast.error('Failed to update region')
    }
  }

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: UserCheck },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: UserX },
  }

  const regionConfig = {
    corfu: { label: 'Corfu', color: 'bg-blue-100 text-blue-700' },
    greece: { label: 'Greece', color: 'bg-purple-100 text-purple-700' },
  }

  const statCards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: 'text-stone-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
    { label: 'Approved', value: stats.approved, icon: UserCheck, color: 'text-green-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Users</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">{stat.label}</p>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              placeholder="Search by name, email, location, status..."
              defaultValue={currentFilters.search ?? ''}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>

          {/* Status filter */}
          <Select
            value={currentFilters.status ?? 'all'}
            onValueChange={(val) => updateParams({ status: val === 'all' ? undefined : val })}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Region filter */}
          <Select
            value={currentFilters.region ?? 'all'}
            onValueChange={(val) => updateParams({ region: val === 'all' ? undefined : val })}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="corfu">Corfu</SelectItem>
              <SelectItem value="greece">Greece</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={currentFilters.sortBy ?? 'newest'}
            onValueChange={(val) => updateParams({ sortBy: val })}
          >
            <SelectTrigger className="w-[160px] h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Registration Date</SelectItem>
              <SelectItem value="last_order">Last Order</SelectItem>
              <SelectItem value="total_spent">Total Spent</SelectItem>
              <SelectItem value="total_orders">Total Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer list */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {initialCustomers.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            <Users className="h-12 w-12 text-stone-300 mx-auto mb-3" />
            <p>No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {initialCustomers.map((customer) => {
              const sConfig = statusConfig[customer.status]
              const rConfig = regionConfig[customer.region]

              return (
                <div
                  key={customer.id}
                  className={cn(
                    'p-4 sm:p-5 hover:bg-stone-50 transition-colors',
                    customer.status === 'pending' && 'bg-yellow-50/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Customer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-stone-900">
                          {customer.first_name} {customer.last_name}
                        </h3>
                        <Badge className={cn('text-[11px] px-1.5 py-0', sConfig.color)}>
                          {sConfig.label}
                        </Badge>
                        <Badge className={cn('text-[11px] px-1.5 py-0', rConfig.color)}>
                          {rConfig.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {customer.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {customer.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(customer.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      {/* Order stats */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {customer.total_orders} orders
                        </span>
                        <span>
                          Total spent: €{customer.total_spent.toFixed(2)}
                        </span>
                        {customer.last_order_at && (
                          <span>
                            Last order: {new Date(customer.last_order_at).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Region selector */}
                      <Select
                        value={customer.region}
                        onValueChange={(val) =>
                          handleRegionChange(customer.id, val as 'corfu' | 'greece')
                        }
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corfu">Corfu</SelectItem>
                          <SelectItem value="greece">Greece</SelectItem>
                        </SelectContent>
                      </Select>

                      {customer.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusChange(customer.id, 'approved')}
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleStatusChange(customer.id, 'rejected')}
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {customer.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleStatusChange(customer.id, 'rejected')}
                        >
                          Revoke
                        </Button>
                      )}
                      {customer.status === 'rejected' && (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(customer.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(customer.id)}
                        title="Delete user permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100">
            <span className="text-sm text-stone-500">
              Showing {initialCustomers.length} of {total} users
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-stone-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
