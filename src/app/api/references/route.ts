import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Get user's org
  const { data: membership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) {
    return NextResponse.json({ data: [] })
  }

  const { data: docs } = await admin
    .from('reference_documents')
    .select('id, file_name, file_type, file_size_bytes, is_analyzed, analyzed_at, created_at')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: docs || [] })
}
