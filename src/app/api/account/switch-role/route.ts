export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['buyer', 'seller', 'rider'] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await req.json()

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  const targetRole = role as AllowedRole

  // Buyer is always available ΓÇö everyone can browse and buy.
  if (targetRole === 'seller') {
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!seller) {
      return NextResponse.json(
        { error: 'no_seller_profile', message: 'Set up your store first before switching to seller mode.' },
        { status: 409 }
      )
    }
  }

  if (targetRole === 'rider') {
    const { data: rider } = await supabase
      .from('rider_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (!rider) {
      return NextResponse.json(
        { error: 'no_rider_profile', message: 'Apply to become a rider first before switching to rider mode.' },
        { status: 409 }
      )
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: targetRole, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ data: { role: targetRole }, error: null })
}

