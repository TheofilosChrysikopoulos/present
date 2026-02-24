import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const code = requestUrl.searchParams.get('code')

  const supabase = await createClient()
  let userId: string | undefined
  let email: string | undefined

  // Handle token_hash flow (from admin-generated magic links sent via our email)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (error) {
      console.error('verifyOtp error:', error)
    } else if (data.session) {
      userId = data.session.user.id
      email = data.session.user.email ?? undefined
    }
  }
  // Fallback: handle PKCE code flow
  else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('exchangeCodeForSession error:', error)
    } else if (data.session) {
      userId = data.session.user.id
      email = data.session.user.email ?? undefined
    }
  }

  // Link customer record to auth user if needed
  if (userId && email) {
    const adminClient = createAdminClient()
    const { data: customer } = await adminClient
      .from('customers')
      .select('id, auth_user_id, device_verified')
      .eq('email', email)
      .maybeSingle()

    if (customer && !customer.auth_user_id) {
      await adminClient
        .from('customers')
        .update({ auth_user_id: userId, device_verified: true })
        .eq('id', customer.id)
    } else if (customer && !customer.device_verified) {
      await adminClient
        .from('customers')
        .update({ device_verified: true })
        .eq('id', customer.id)
    }
  }

  // Redirect back to the home page after auth
  return NextResponse.redirect(new URL('/', request.url))
}
