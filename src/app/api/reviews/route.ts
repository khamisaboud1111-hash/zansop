export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('reviews')
    .select('*, buyer:profiles(full_name, avatar_url)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product_id, order_id, rating, comment } = await req.json()

  if (!product_id || !order_id || !rating) {
    return NextResponse.json({ error: 'product_id, order_id, and rating are required' }, { status: 400 })
  }

  // Verify the order belongs to this user and is delivered, and contains this product
  const { data: order } = await supabase.from('orders').select('status, buyer_id').eq('id', order_id).single()
  if (!order || order.buyer_id !== user.id) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'delivered') return NextResponse.json({ error: 'You can only review delivered orders' }, { status: 400 })

  const { data: item } = await supabase.from('order_items').select('id').eq('order_id', order_id).eq('product_id', product_id).single()
  if (!item) return NextResponse.json({ error: 'Product not found in this order' }, { status: 400 })

  const { data, error } = await supabase
    .from('reviews')
    .insert({ product_id, order_id, buyer_id: user.id, rating, comment: comment ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })

  // Notify seller
  const { data: product } = await supabase.from('products').select('name, seller_id, sellers(user_id)').eq('id', product_id).single()
  const sellerUserId = (product as any)?.sellers?.user_id
  if (sellerUserId) {
    await supabase.from('notifications').insert({
      user_id: sellerUserId,
      type: 'new_review',
      title_en: 'New review received',
      title_sw: 'Maoni mapya yamepokelewa',
      body_en: `${product?.name} received a ${rating}-star review.`,
      body_sw: `${product?.name} imepata maoni ya nyota ${rating}.`,
      link: '/seller/products',
    })
  }

  return NextResponse.json({ data, error: null })
}

