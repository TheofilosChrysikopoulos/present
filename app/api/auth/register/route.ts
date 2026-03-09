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

    // 1. Create a Supabase auth user so the customer can be auto-logged-in
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      email_confirm: true, // mark email as confirmed immediately
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }

    // 2. Insert customer record linked to the auth user
    const { data, error } = await supabase
      .from('customers')
      .insert({
        email: parsed.data.email,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        location: parsed.data.location,
        region: 'greece',
        auth_user_id: authUser.user.id,
        device_verified: true,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Customer registration error:', error)
      // Clean up the auth user if customer insert fails
      await supabase.auth.admin.deleteUser(authUser.user.id).catch(() => {})
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }

    // 3. Generate a magic link so the client can auto-login
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: parsed.data.email,
    })

    let autoLoginUrl: string | null = null
    if (!linkError && linkData?.properties?.hashed_token) {
      autoLoginUrl = `${baseUrl}/api/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink`
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
      { id: data.id, message: 'Registration successful', autoLoginUrl },
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
