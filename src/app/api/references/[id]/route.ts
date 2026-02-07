import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: docId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const { data: doc } = await admin
    .from('reference_documents')
    .select('id, org_id, file_url, file_name')
    .eq('id', docId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })
  }

  // Check membership
  const { data: member } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', doc.org_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  // Generate signed URL
  const path = doc.file_url.split('/reference-documents/')[1]
  if (!path) {
    return NextResponse.json({ error: 'Fil saknas' }, { status: 404 })
  }

  const { data: signedUrl, error } = await admin.storage
    .from('reference-documents')
    .createSignedUrl(path, 60) // 60 seconds

  if (error || !signedUrl) {
    return NextResponse.json({ error: 'Kunde inte skapa nedladdningslänk' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: docId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Get doc to verify ownership
  const { data: doc } = await admin
    .from('reference_documents')
    .select('id, org_id, file_url')
    .eq('id', docId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Dokument hittades inte' }, { status: 404 })
  }

  // Check membership
  const { data: member } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', doc.org_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  // Delete file from storage
  if (doc.file_url) {
    const path = doc.file_url.split('/reference-documents/')[1]
    if (path) {
      await admin.storage.from('reference-documents').remove([path])
    }
  }

  // Delete db record
  await admin.from('reference_documents').delete().eq('id', docId)

  return NextResponse.json({ success: true })
}
