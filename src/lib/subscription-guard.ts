import { getSupabaseAdmin } from '@/lib/supabase/admin'

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  bas: 5,
  pro: Infinity,
  enterprise: Infinity,
}

export async function checkReportLimit(orgId: string): Promise<{
  allowed: boolean
  remaining: number
  plan: string
}> {
  const admin = getSupabaseAdmin()
  const { data: org } = await admin
    .from('organizations')
    .select('subscription_plan, reports_used_this_year')
    .eq('id', orgId)
    .single()

  if (!org) {
    return { allowed: false, remaining: 0, plan: 'free' }
  }

  const limit = PLAN_LIMITS[org.subscription_plan] || 1
  const remaining = limit - org.reports_used_this_year

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    plan: org.subscription_plan,
  }
}

export function canExportPDF(plan: string): boolean {
  return plan !== 'free'
}
