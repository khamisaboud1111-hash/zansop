export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDefaultDeliveryZones } from '@/lib/deliveryZones'
import type { DeliveryZone } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select(`*, items:order_items(*, product:products(name, images:product_images(*)))`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

interface CreateOrderBody {
  items: Array<{ product_id: string; quantity: number }>
  delivery_zone: DeliveryZone
  delivery_address: string
  delivery_name: string
  delivery_phone: string
  payment_method: string
  payment_reference?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateOrderBody = await req.json()

  if (!body.items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

  // The entire order (price/seller re-read, stock locking, inserts, stock
  // decrements, tracking, commissions, notifications) runs atomically inside
  // the create_order database function ΓÇö never trust the client's unit_price
  // or seller_id.
  const { data, error } = await supabase.rpc('create_order', {
    p_buyer_id: user.id,
    // Must be the array itself, not JSON.stringify(...): p_items is jsonb, and
    // a stringified array arrives as a jsonb *string*, so the function's
    // jsonb_typeof(p_items) = 'array' check fails with "Cart is empty".
    p_items: body.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    p_delivery_zone: body.delivery_zone,
    p_delivery_address: body.delivery_address,
    p_delivery_name: body.delivery_name,
    p_delivery_phone: body.delivery_phone,
    p_payment_method: body.payment_method,
    p_payment_reference: body.payment_reference ?? null,
    p_notes: body.notes ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

