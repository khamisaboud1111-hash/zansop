export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'
import { riderApplicationSchema } from '@/lib/validation/rider'

export const POST = withValidation(riderApplicationSchema, async (data) => {
  const supabase = createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  // Don't let a rider application clobber an existing admin's role ΓÇö keep
  // them as admin, just also let them hold a rider_profiles row so they can
  // switch into rider mode from Settings if they want to.
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single()
  const nextRole = currentProfile?.role === 'admin' ? 'admin' : 'rider'

  // Update the base profile: name, phone, role -> rider (pending verification),
  // unless this account is an admin, in which case role is left untouched.
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone_number,
      role: nextRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.user.id)

  if (profileErr) {
    console.error('[rider/apply] profile update error:', profileErr)
    return NextResponse.json({ error: 'Imeshindikana kusasisha wasifu (profile update failed)' }, { status: 500 })
  }

  // Upsert the rider_profiles application row. is_verified stays false until
  // an admin reviews the documents in the admin verification queue.
  const { data: riderProfile, error: riderErr } = await supabase
    .from('rider_profiles')
    .upsert(
      {
        id: auth.user.id,
        national_id: data.national_id,
        driving_license: data.driving_license,
        motorcycle_registration: data.motorcycle_registration,
        selfie_url: data.selfie_url ?? null,
        license_scan_url: data.license_scan_url ?? null,
        emergency_contact: data.emergency_contact,
        payout_method: data.payout_method,
        payout_account_number: data.payout_account_number,
        is_verified: false,
        is_online: false,
        account_status: 'active',
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (riderErr) {
    console.error('[rider/apply] rider_profiles upsert error:', riderErr)
    return NextResponse.json({ error: 'Imeshindikana kutuma maombi (application failed)' }, { status: 500 })
  }

  return NextResponse.json({ rider_profile: riderProfile, message: 'Maombi yamepokelewa. Yanasubiri uthibitisho wa msimamizi.' })
})

