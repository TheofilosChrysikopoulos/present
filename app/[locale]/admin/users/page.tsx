import { getCustomers, getCustomerStats } from '@/lib/queries/customers'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const status = params.status as 'pending' | 'approved' | 'rejected' | undefined
  const region = params.region as 'corfu' | 'greece' | undefined
  const search = params.search
  const sortBy = (params.sortBy as 'newest' | 'last_order' | 'total_spent' | 'total_orders') ?? 'newest'
  const page = Number(params.page ?? '1')

  const [customersData, stats] = await Promise.all([
    getCustomers({ status, region, search, sortBy, page }),
    getCustomerStats(),
  ])

  return (
    <AdminUsersClient
      initialCustomers={customersData.customers}
      total={customersData.total}
      page={customersData.page}
      totalPages={customersData.totalPages}
      stats={stats}
      currentFilters={{ status, region, search, sortBy }}
    />
  )
}
