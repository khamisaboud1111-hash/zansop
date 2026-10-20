export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { confirm } = await req.json()
  if (confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Confirmation text did not match.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // profiles row cascades on delete (profiles.id references auth.users on delete cascade),
  // which in turn cascades to sellers, rider_profiles, wishlists, etc.
  return NextResponse.json({ data: { deleted: true }, error: null })
}

