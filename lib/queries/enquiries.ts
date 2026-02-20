import { createClient } from '@/lib/supabase/server'
import type { Enquiry, EnquiryCartItem } from '@/lib/types'

export interface CreateEnquiryInput {
  name: string
  email: string
  company?: string
  phone?: string
  message?: string
  cart_snapshot: EnquiryCartItem[]
}

export async function createEnquiry(input: CreateEnquiryInput): Promise<Enquiry> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enquiries')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Enquiry
}

export interface EnquiryFilters {
  status?: Enquiry['status']
  page?: number
  limit?: number
}

export async function getEnquiries(filters: EnquiryFilters = {}) {
  const supabase = await createClient()
  const { status, page = 1, limit = 20 } = filters

  let query = supabase
    .from('enquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return {
    enquiries: (data ?? []) as Enquiry[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getEnquiryById(id: string): Promise<Enquiry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Enquiry
}

export async function updateEnquiryStatus(
  id: string,
  status: Enquiry['status']
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enquiries')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function getEnquiryStats() {
  const supabase = await createClient()
  const [total, newCount] = await Promise.all([
    supabase.from('enquiries').select('id', { count: 'exact', head: true }),
    supabase
      .from('enquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
  ])
  return {
    total: total.count ?? 0,
    new: newCount.count ?? 0,
  }
}
