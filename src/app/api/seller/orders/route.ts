import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Get order IDs for this seller
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('seller_id', seller.id)

    const orderIds = [...new Set((items ?? []).map((i: any) => i.order_id))]
    
    if (orderIds.length === 0) {
      return NextResponse.json({
        orders: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      }, {
        headers: { 'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=15' },
      })
    }

    // Build query with server-side filtering and pagination
    let query = supabase
      .from('orders')
      .select(`*, items:order_items(*, product:products(name, images:product_images(*))), buyer:profiles(full_name, email, phone)`, { count: 'exact' })
      .in('id', orderIds)

    // Server-side search
    if (search) {
      query = query.or(`id.ilike.%${search}%,buyer.full_name.ilike.%${search}%,delivery_address.ilike.%${search}%`)
    }

    // Server-side status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Server-side sorting and pagination
    query = query.order('created_at', { ascending: false })
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      orders: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=15',
      },
    })
  } catch (error) {
    console.error('Error loading orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status, note } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify seller owns this order
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('seller_id', seller.id)
      .eq('order_id', orderId)

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'Order not found or not authorized' }, { status: 404 })
    }

    // An order only moves forward, one step at a time, and it can only
    // reach delivered once a rider has actually delivered it. The database
    // enforces the same rule; this is here so the seller gets a clear
    // message instead of a generic failure.
    const { data: current } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (status !== 'cancelled') {
      const next: Record<string, string> = {
        pending: 'confirmed',
        confirmed: 'packed',
        packed: 'out_for_delivery',
        out_for_delivery: 'delivered',
      }
      if (next[current.status] !== status) {
        return NextResponse.json(
          { error: `An order only moves forward (${current.status} -> ${status} is not a step)` },
          { status: 409 }
        )
      }
      if (status === 'delivered') {
        const { data: trip } = await supabase
          .from('deliveries')
          .select('id')
          .eq('order_id', orderId)
          .eq('status', 'delivered')
          .limit(1)
        if (!trip || trip.length === 0) {
          return NextResponse.json(
            { error: 'The rider has not delivered this order yet' },
            { status: 409 }
          )
        }
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 409 })
    }

    // Insert tracking record
    await supabase.from('order_tracking').insert({
      order_id: orderId,
      status,
      note: note || null,
      created_by: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

