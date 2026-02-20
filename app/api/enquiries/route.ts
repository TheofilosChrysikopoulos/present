import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const enquirySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
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
    const { data, error } = await supabase
      .from('enquiries')
      .insert(parsed.data)
      .select('id')
      .single()

    if (error) {
      console.error('Enquiry insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('Enquiry API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
