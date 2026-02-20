import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { getEnquiries } from '@/lib/queries/enquiries'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AdminEnquiriesPageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-orange-100 text-orange-700',
  read: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-stone-100 text-stone-500',
}

export default async function AdminEnquiriesPage({
  searchParams,
}: AdminEnquiriesPageProps) {
  const sp = await searchParams
  const locale = await getLocale()
  const base = locale === 'el' ? '/el' : ''

  const validStatuses = ['new', 'read', 'replied', 'archived'] as const
  const statusFilter = validStatuses.includes(
    sp.status as (typeof validStatuses)[number]
  )
    ? (sp.status as (typeof validStatuses)[number])
    : undefined

  const { enquiries, total, page, totalPages } = await getEnquiries({
    status: statusFilter,
    page: sp.page ? Number(sp.page) : 1,
    limit: 20,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Enquiries</h1>
          <p className="text-sm text-stone-500 mt-0.5">{total} total</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5">
        {[undefined, 'new', 'read', 'replied', 'archived'].map((s) => (
          <Link
            key={s ?? 'all'}
            href={`${base}/admin/enquiries${s ? `?status=${s}` : ''}`}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              statusFilter === s
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">
                Contact
              </th>
              <th className="text-center px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide hidden md:table-cell">
                Items
              </th>
              <th className="text-center px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {enquiries.map((enq) => (
              <tr
                key={enq.id}
                className="hover:bg-stone-50 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`${base}/admin/enquiries/${enq.id}`}
                    className="block"
                  >
                    <p className="font-medium text-stone-900">{enq.name}</p>
                    <p className="text-xs text-stone-500">{enq.email}</p>
                    {enq.company && (
                      <p className="text-xs text-stone-400">{enq.company}</p>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <Link href={`${base}/admin/enquiries/${enq.id}`}>
                    <span className="text-stone-600">
                      {Array.isArray(enq.cart_snapshot) ? enq.cart_snapshot.length : 0} items
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`${base}/admin/enquiries/${enq.id}`}>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_COLORS[enq.status]
                      )}
                    >
                      {enq.status.charAt(0).toUpperCase() + enq.status.slice(1)}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${base}/admin/enquiries/${enq.id}`}>
                    <span className="text-xs text-stone-500">
                      {new Date(enq.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {enquiries.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-500">
            No enquiries found
          </p>
        )}
      </div>
    </div>
  )
}
