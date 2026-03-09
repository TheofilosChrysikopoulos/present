import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { getCustomerStats } from '@/lib/queries/customers'
import { getEnquiryStats } from '@/lib/queries/enquiries'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — render without sidebar (e.g. login page)
  if (!user) {
    return <>{children}</>
  }

  const [customerStats, enquiryStats] = await Promise.all([
    getCustomerStats(),
    getEnquiryStats(),
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <AdminSidebar
        pendingUsers={customerStats.pending}
        newEnquiries={enquiryStats.new}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
