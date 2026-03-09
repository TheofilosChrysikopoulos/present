import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovalEmail } from '@/lib/email/mailer'

const updateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  region: z.enum(['corfu', 'greece']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, string> = {}
    if (parsed.data.status) updateData.status = parsed.data.status
    if (parsed.data.region) updateData.region = parsed.data.region

    // Use admin client to bypass RLS for the update
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('customers')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Customer update error:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // If customer was approved, send them an approval notification email
    if (parsed.data.status === 'approved') {
      const { data: customer } = await adminClient
        .from('customers')
        .select('first_name, email')
        .eq('id', id)
        .single()

      if (customer) {
        sendApprovalEmail({
          first_name: customer.first_name,
          email: customer.email,
        }).catch((e) => console.error('Failed to send approval email:', e))
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Customer API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get customer to find linked auth user
    const { data: customer } = await adminClient
      .from('customers')
      .select('auth_user_id')
      .eq('id', id)
      .single()

    // Delete orders linked to this customer
    await adminClient.from('orders').delete().eq('customer_id', id)

    // Delete customer record
    const { error } = await adminClient.from('customers').delete().eq('id', id)
    if (error) {
      console.error('Customer delete error:', error)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    // Delete linked auth user if exists
    if (customer?.auth_user_id) {
      await adminClient.auth.admin.deleteUser(customer.auth_user_id).catch((e) =>
        console.error('Failed to delete auth user:', e)
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Customer DELETE error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
