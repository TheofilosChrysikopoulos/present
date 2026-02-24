import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRegistrationNotification, sendRegistrationConfirmation } from '@/lib/email/mailer'

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email required'),
  location: z.string().min(2, 'Location is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if email already registered (using service role to bypass RLS)
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id, status')
      .eq('email', parsed.data.email)
      .maybeSingle()

    if (checkError) {
      console.error('Customer lookup error:', checkError)
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }

    if (existing) {
      if (existing.status === 'rejected') {
        return NextResponse.json(
          { error: 'This email has been rejected. Please contact support.' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'This email is already registered.' },
        { status: 409 }
      )
    }

    // Insert customer record (using service role to bypass RLS)
    const { data, error } = await supabase
      .from('customers')
      .insert({
        email: parsed.data.email,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        location: parsed.data.location,
        region: 'greece',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Customer registration error:', error)
      // Provide more helpful error message
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }

    // Send notification emails (non-blocking — don't fail registration if email fails)
    sendRegistrationNotification({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      location: parsed.data.location,
    }).catch((e) => console.error('Failed to send admin notification:', e))

    sendRegistrationConfirmation({
      first_name: parsed.data.first_name,
      email: parsed.data.email,
    }).catch((e) => console.error('Failed to send registration confirmation:', e))

    console.log(
      `[NEW REGISTRATION] ${parsed.data.first_name} ${parsed.data.last_name} (${parsed.data.email}) from ${parsed.data.location}`
    )

    return NextResponse.json(
      { id: data.id, message: 'Registration successful' },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('Registration API error:', message, stack)
    return NextResponse.json(
      { error: 'Server error', detail: message },
      { status: 500 }
    )
  }
}
