import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderNotification } from '@/lib/email/mailer'

const enquirySchema = z.object({
  message: z.string().optional(),
  cart_snapshot: z.array(
    z.object({
      product_id: z.string(),
      sku: z.string(),
      name_en: z.string(),
      name_el: z.string(),
      qty: z.number().int().positive(),
      price: z.number().positive(),
      variant_id: z.string().optional(),
      variant_color_en: z.string().optional(),
      variant_color_el: z.string().optional(),
      size_id: z.string().optional(),
      size_label_en: z.string().optional(),
      size_label_el: z.string().optional(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = enquirySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // User must be logged in to place an order
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to place an order.' }, { status: 401 })
    }

    // Get customer record via admin client
    const adminClient = createAdminClient()
    const { data: customer } = await adminClient
      .from('customers')
      .select('id, first_name, last_name, email, location')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ error: 'Customer account not found.' }, { status: 404 })
    }

    const customerName = `${customer.first_name} ${customer.last_name}`

    // Insert enquiry with customer info auto-filled
    const { data, error } = await adminClient
      .from('enquiries')
      .insert({
        name: customerName,
        email: customer.email,
        company: customer.location,
        message: parsed.data.message || null,
        cart_snapshot: parsed.data.cart_snapshot,
        customer_id: customer.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Enquiry insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Also create an order record
    const totalAmount = parsed.data.cart_snapshot.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    )

    await adminClient.from('orders').insert({
      customer_id: customer.id,
      enquiry_id: data.id,
      items: parsed.data.cart_snapshot,
      total_amount: totalAmount,
    })

    // Send order notification email to admin
    sendOrderNotification({
      customerName,
      customerEmail: customer.email,
      customerLocation: customer.location,
      message: parsed.data.message,
      items: parsed.data.cart_snapshot,
      totalAmount,
    }).catch((e) => console.error('Failed to send order notification email:', e))

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('Enquiry API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
