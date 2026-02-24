import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMagicLinkEmail } from '@/lib/email/mailer'

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { email } = parsed.data

    // Check if customer exists (admin client to bypass RLS)
    const { data: customer, error: lookupError } = await supabase
      .from('customers')
      .select('id, first_name, status, auth_user_id, device_verified')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) {
      console.error('Customer lookup error:', lookupError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'No account found with this email. Please register first.' },
        { status: 404 }
      )
    }

    if (customer.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending approval. You will receive an email once approved.', code: 'PENDING' },
        { status: 403 }
      )
    }

    if (customer.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your account has been rejected. Please contact support.' },
        { status: 403 }
      )
    }

    // Generate magic link via Supabase Admin API (does NOT send an email)
    const baseUrl = request.nextUrl.origin
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Magic link generation error:', linkError)
      return NextResponse.json(
        { error: 'Failed to generate login link. Please try again.' },
        { status: 500 }
      )
    }

    // Build custom callback URL with token_hash so our server-side callback can use verifyOtp
    const magicLink = `${baseUrl}/api/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink`

    // Send the magic link via our own email (Gmail SMTP)
    const result = await sendMagicLinkEmail({
      first_name: customer.first_name,
      email,
      magicLink,
    })

    if (!result.success) {
      console.error('Failed to send magic link email')
      return NextResponse.json(
        { error: 'Failed to send login email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Login link sent to your email',
      needsVerification: !customer.device_verified,
    })
  } catch (err) {
    console.error('Login API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
