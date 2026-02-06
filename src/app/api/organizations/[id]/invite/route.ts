import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  // Check admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  const body = await request.json()
  const { email } = body as { email: string }

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email krävs' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Check if user exists
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.trim())
    .single()

  if (profile) {
    // Check if already member
    const { data: existing } = await admin
      .from('org_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', profile.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Redan medlem' }, { status: 400 })
    }

    // Add as member
    await admin.from('org_members').insert({
      org_id: orgId,
      user_id: profile.id,
      role: 'member',
    })

    return NextResponse.json({ success: true })
  }

  // User doesn't exist yet - send invite via Supabase Auth
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: `${appUrl}/auth/callback?org_id=${orgId}`,
  })

  if (error) {
    return NextResponse.json({ error: 'Kunde inte skicka inbjudan' }, { status: 500 })
  }

  return NextResponse.json({ success: true, invited: true })
}
