import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return _stripe
}

export const PRICE_IDS: Record<string, string> = {
  bas: process.env.STRIPE_PRICE_BAS || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}

export const PLAN_NAMES: Record<string, string> = {
  free: 'Gratis',
  bas: 'Bas',
  pro: 'Pro',
  enterprise: 'Enterprise',
}
