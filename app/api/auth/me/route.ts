import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ customer: null }, { status: 200 })
    }

    // Use admin client to bypass RLS — ensures we can always read the customer record
    const adminClient = createAdminClient()
    const { data: customer } = await adminClient
      .from('customers')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    return NextResponse.json({ customer: customer ?? null }, { status: 200 })
  } catch (err) {
    console.error('Customer me API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
