import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer, CustomerWithStats } from '@/lib/types'

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single()

  if (error) return null
  return data as Customer
}

export async function getCustomerByAuthId(authUserId: string): Promise<Customer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (error) return null
  return data as Customer
}

export interface CreateCustomerInput {
  email: string
  first_name: string
  last_name: string
  location: string
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function linkCustomerToAuth(
  customerId: string,
  authUserId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ auth_user_id: authUserId, device_verified: true })
    .eq('id', customerId)

  if (error) throw error
}

export async function updateCustomerStatus(
  customerId: string,
  status: Customer['status']
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ status })
    .eq('id', customerId)

  if (error) throw error
}

export async function updateCustomerRegion(
  customerId: string,
  region: Customer['region']
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ region })
    .eq('id', customerId)

  if (error) throw error
}

export interface CustomerFilters {
  status?: Customer['status']
  region?: Customer['region']
  search?: string
  sortBy?: 'newest' | 'last_order' | 'total_spent' | 'total_orders'
  page?: number
  limit?: number
}

export async function getCustomers(filters: CustomerFilters = {}) {
  const supabase = createAdminClient()
  const {
    status,
    region,
    search,
    sortBy = 'newest',
    page = 1,
    limit = 20,
  } = filters

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }

  if (region) {
    query = query.eq('region', region)
  }

  if (search) {
    // Use RPC for accent-insensitive, case-insensitive substring search
    try {
      const { data: matchingIds, error: rpcError } = await supabase.rpc('search_customer_ids', { search_term: search })
      if (rpcError) throw rpcError
      const ids = (matchingIds as { id: string }[] | null)?.map(r => r.id) ?? []
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        return {
          customers: [] as CustomerWithStats[],
          total: 0,
          page,
          limit,
          totalPages: 0,
        }
      }
    } catch {
      // Fallback: basic ilike search
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,location.ilike.%${search}%,status.ilike.%${search}%,region.ilike.%${search}%`
      )
    }
  }

  // Sorting
  switch (sortBy) {
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) {
    console.error('Failed to fetch customers:', error)
    return {
      customers: [] as CustomerWithStats[],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // Fetch order stats for each customer
  const customers = (data ?? []) as Customer[]
  const customerIds = customers.map((c) => c.id)

  if (customerIds.length === 0) {
    return {
      customers: [] as CustomerWithStats[],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // Get order aggregates (wrapped in try-catch since orders table may not exist yet)
  let statsMap = new Map<string, { total_orders: number; total_spent: number; last_order_at: string | null }>()
  try {
    const { data: orderStats } = await supabase
      .from('orders')
      .select('customer_id, total_amount, created_at')
      .in('customer_id', customerIds)

    for (const order of orderStats ?? []) {
      const existing = statsMap.get(order.customer_id) ?? { total_orders: 0, total_spent: 0, last_order_at: null }
      existing.total_orders++
      existing.total_spent += Number(order.total_amount)
      if (!existing.last_order_at || order.created_at > existing.last_order_at) {
        existing.last_order_at = order.created_at
      }
      statsMap.set(order.customer_id, existing)
    }
  } catch (e) {
    console.error('Failed to fetch order stats (orders table may not exist yet):', e)
  }

  const customersWithStats: CustomerWithStats[] = customers.map((c) => ({
    ...c,
    total_orders: statsMap.get(c.id)?.total_orders ?? 0,
    total_spent: statsMap.get(c.id)?.total_spent ?? 0,
    last_order_at: statsMap.get(c.id)?.last_order_at ?? null,
  }))

  // Sort by order stats if needed
  if (sortBy === 'total_spent') {
    customersWithStats.sort((a, b) => b.total_spent - a.total_spent)
  } else if (sortBy === 'total_orders') {
    customersWithStats.sort((a, b) => b.total_orders - a.total_orders)
  } else if (sortBy === 'last_order') {
    customersWithStats.sort((a, b) => {
      if (!a.last_order_at && !b.last_order_at) return 0
      if (!a.last_order_at) return 1
      if (!b.last_order_at) return -1
      return b.last_order_at.localeCompare(a.last_order_at)
    })
  }

  return {
    customers: customersWithStats,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getCustomerStats() {
  try {
    const supabase = createAdminClient()
    const [total, pending, approved] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ])
    return {
      total: total.count ?? 0,
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
    }
  } catch (e) {
    console.error('Failed to fetch customer stats:', e)
    return { total: 0, pending: 0, approved: 0 }
  }
}
