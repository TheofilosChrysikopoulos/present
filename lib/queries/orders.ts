import { createClient } from '@/lib/supabase/server'
import type { Order, OrderWithCustomer } from '@/lib/types'

export async function getOrdersByCustomerId(customerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Order[]
}

export async function getOrdersByAuthUserId(authUserId: string) {
  const supabase = await createClient()

  // First get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single()

  if (!customer) return []

  return getOrdersByCustomerId(customer.id)
}

export async function createOrder(input: {
  customer_id: string
  enquiry_id?: string
  items: any[]
  total_amount: number
  notes?: string
}): Promise<Order> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}

export async function getAllOrders(filters: {
  status?: Order['status']
  customerId?: string
  page?: number
  limit?: number
} = {}) {
  const supabase = await createClient()
  const { status, customerId, page = 1, limit = 20 } = filters

  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers (*)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return {
    orders: (data ?? []) as OrderWithCustomer[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}
