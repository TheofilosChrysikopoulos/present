import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { getEnquiryById } from '@/lib/queries/enquiries'
import { EnquiryStatusUpdater } from './EnquiryStatusUpdater'

interface EnquiryDetailPageProps {
  params: Promise<{ id: string }>
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-orange-100 text-orange-700',
  read: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-stone-100 text-stone-500',
}

export default async function EnquiryDetailPage({
  params,
}: EnquiryDetailPageProps) {
  const { id } = await params
  const locale = await getLocale()
  const base = locale === 'el' ? '/el' : ''

  const enquiry = await getEnquiryById(id)
  if (!enquiry) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`${base}/admin/enquiries`}
          className="text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Enquiries
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="font-semibold text-stone-900 mb-4">Contact</h2>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-xs text-stone-500">Name</dt>
                <dd className="text-sm font-medium text-stone-900">{enquiry.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Email</dt>
                <dd>
                  <a
                    href={`mailto:${enquiry.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {enquiry.email}
                  </a>
                </dd>
              </div>
              {enquiry.company && (
                <div>
                  <dt className="text-xs text-stone-500">Company</dt>
                  <dd className="text-sm text-stone-700">{enquiry.company}</dd>
                </div>
              )}
              {enquiry.phone && (
                <div>
                  <dt className="text-xs text-stone-500">Phone</dt>
                  <dd className="text-sm text-stone-700">{enquiry.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-stone-500">Date</dt>
                <dd className="text-sm text-stone-700">
                  {new Date(enquiry.created_at).toLocaleString('en-GB', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Message */}
          {enquiry.message && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h2 className="font-semibold text-stone-900 mb-2">Message</h2>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                {enquiry.message}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="font-semibold text-stone-900 mb-3">Status</h2>
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[enquiry.status]}`}
              >
                {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
              </span>
            </div>
            <EnquiryStatusUpdater id={enquiry.id} currentStatus={enquiry.status} />
          </div>
        </div>

        {/* Cart snapshot */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="font-semibold text-stone-900 mb-4">
              Product Selection ({enquiry.cart_snapshot.length} items)
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left py-2 text-xs font-medium text-stone-500">SKU</th>
                  <th className="text-left py-2 text-xs font-medium text-stone-500">Product</th>
                  <th className="text-left py-2 text-xs font-medium text-stone-500 hidden md:table-cell">Color</th>
                  <th className="text-right py-2 text-xs font-medium text-stone-500">Qty</th>
                  <th className="text-right py-2 text-xs font-medium text-stone-500">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {enquiry.cart_snapshot.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-3 font-mono text-xs text-stone-500">
                      {item.sku}
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-stone-900">{item.name_en}</p>
                      <p className="text-xs text-stone-400">{item.name_el}</p>
                    </td>
                    <td className="py-2.5 pr-3 hidden md:table-cell text-stone-500 text-xs">
                      {item.variant_color_en ?? '—'}
                    </td>
                    <td className="py-2.5 text-right text-stone-700">{item.qty}</td>
                    <td className="py-2.5 text-right text-stone-900 font-medium">
                      €{(item.price * item.qty).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-stone-200">
                  <td colSpan={3} className="pt-3 text-right font-semibold text-stone-700 pr-3 hidden md:table-cell">
                    Total
                  </td>
                  <td colSpan={1} className="pt-3 text-right font-semibold text-stone-700 md:hidden">
                    Total
                  </td>
                  <td className="pt-3 text-right font-bold text-stone-900">
                    €{enquiry.cart_snapshot
                      .reduce((sum, i) => sum + i.price * i.qty, 0)
                      .toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
