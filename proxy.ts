import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Run next-intl middleware for locale routing
  const intlResponse = intlMiddleware(request)

  // Determine the locale from the pathname (default to 'en')
  const localeMatch = pathname.match(/^\/(en|el)(\/|$)/)
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale

  // Check if this is an admin route (excluding the login page)
  const isAdminRoute =
    pathname.match(/^\/(en\/|el\/)?admin/) &&
    !pathname.match(/^\/(en\/|el\/)?admin\/login/)

  if (!isAdminRoute) {
    return intlResponse
  }

  // For admin routes, check authentication and role
  const supabaseResponse = intlResponse ?? NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const loginUrl = new URL(
    locale === routing.defaultLocale ? '/admin/login' : `/${locale}/admin/login`,
    request.url
  )

  if (!session) {
    return NextResponse.redirect(loginUrl)
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
