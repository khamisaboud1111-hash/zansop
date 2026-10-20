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
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query with server-side filtering, sorting, and pagination
    let query = supabase
      .from('products')
      .select(`*, category:categories(name_sw, name_en), images:product_images(*)`, { count: 'exact' })
      .eq('seller_id', seller.id)

    // Server-side search
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Server-side status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Server-side sorting
    const validSortFields = ['name', 'price', 'stock_quantity', 'created_at', 'total_sold']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false }
    query = query.order(sortField, order)

    // Server-side pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Calculate stats on server side (lightweight)
    const { data: allProducts } = await supabase
      .from('products')
      .select('status, stock_quantity, price')
      .eq('seller_id', seller.id)

    const allProductsData = allProducts ?? []
    const stats = {
      total: count ?? 0,
      active: allProductsData.filter(p => p.status === 'active').length,
      draft: allProductsData.filter(p => p.status === 'draft').length,
      lowStock: allProductsData.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
      totalValue: allProductsData.reduce((s, p) => s + p.price * p.stock_quantity, 0),
    }

    return NextResponse.json({
      products: data ?? [],
      stats,
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
    console.error('Error loading products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, category_id, price, compare_at_price, stock_quantity, sku, weight_grams, is_made_in_zanzibar, location_area, pickup_available, delivery_available, status, images, videos } = body

    if (!name || !category_id || !price || stock_quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate slug and SKU
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
    const skuValue = sku || `${seller.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id: seller.id,
        name,
        description,
        category_id,
        price,
        compare_at_price,
        stock_quantity,
        sku: skuValue,
        weight_grams,
        is_made_in_zanzibar: is_made_in_zanzibar ?? false,
        location_area,
        pickup_available: pickup_available ?? false,
        delivery_available: delivery_available ?? true,
        status: status || 'active',
        slug,
      })
      .select()
      .single()

    if (productError) throw productError

    // Insert images
    if (images?.length > 0) {
      const imageRows = images.map((url: string, i: number) => ({
        product_id: product.id,
        url,
        sort_order: i,
        is_primary: i === 0,
      }))
      const { error: imagesError } = await supabase.from('product_images').insert(imageRows)
      if (imagesError) throw imagesError
    }

    // Insert videos
    if (videos?.length > 0) {
      const videoRows = videos.map((url: string, i: number) => ({
        product_id: product.id,
        url,
        sort_order: i,
      }))
      const { error: videosError } = await supabase.from('product_videos').insert(videoRows)
      if (videosError) throw videosError
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

