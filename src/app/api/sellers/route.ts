export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/utils'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'approved'
  const featured = searchParams.get('featured')

  let q = supabase.from('sellers').select('*').eq('status', status)
  if (featured === 'true') q = q.eq('is_featured', true)

  const { data, error } = await q.order('average_rating', { ascending: false })
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'You already have a seller account' }, { status: 400 })

  const body = await req.json()
  const slug = slugify(body.store_name) + '-' + Date.now().toString(36).slice(-4)

  const { data, error } = await supabase
    .from('sellers')
    .insert({ ...body, user_id: user.id, store_slug: slug, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })

  // Update profile role ΓÇö but don't downgrade an existing admin. They keep
  // their admin role and can still access the seller dashboard by switching
  // roles from Settings once approved.
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfile?.role !== 'admin') {
    await supabase.from('profiles').update({ role: 'seller' }).eq('id', user.id)
  }

  return NextResponse.json({ data, error: null })
}

