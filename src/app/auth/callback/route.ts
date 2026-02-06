import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Kan ignoreras om vi inte kan sätta cookies
            }
          },
        },
      }
    )

    // Byt ut auth-koden mot en session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Kontrollera om användaren har en organisation
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Kolla om användaren är medlem i någon organisation
        const { data: memberships } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)

        // Om ingen organisation, skicka till onboarding
        if (!memberships || memberships.length === 0) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      // Redirect till önskad destination
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Något gick fel, redirect till login med fel
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
