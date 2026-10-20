export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive().int(),
  compare_at_price: z.number().positive().int().optional(),
  stock_quantity: z.number().int().nonnegative().default(0),
  category_id: z.string().uuid().optional(),
  images: z.array(z.object({ url: z.string().url(), is_primary: z.boolean().default(false) })).optional(),
  sku: z.string().max(100).optional(),
}).strict()

const productUpdateSchema = productCreateSchema.partial()

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const category = searchParams.get('category')
  const search   = searchParams.get('search')
  const sort     = searchParams.get('sort') ?? 'newest'
  const page     = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  let categoryId: string | null = null
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .maybeSingle()
    categoryId = cat?.id ?? null
  }

  if (category && !categoryId) {
    return NextResponse.json({ data: [], count: 0, page, pageSize, totalPages: 0 })
  }

  let query = supabase
    .from('products')
    .select(`*, seller:sellers(id, store_name, store_slug, status, logo_url, national_id_verified), category:categories(*), images:product_images(*)`, { count: 'exact' })
    .eq('status', 'active')
    .range(from, to)

  if (categoryId) query = query.eq('category_id', categoryId)
  if (search)     query = query.ilike('name', `%${search}%`)

  switch (sort) {
    case 'price_asc':  query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'popular':    query = query.order('total_sold', { ascending: false }); break
    default:            query = query.order('created_at', { ascending: false })
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, count, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: seller } = await supabase.from('sellers').select('id, status').eq('user_id', user.id).single()
  if (!seller) return NextResponse.json({ error: 'You are not a registered seller' }, { status: 403 })
  if (seller.status !== 'approved') return NextResponse.json({ error: 'Your seller account is not approved yet' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = productCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...parsed.data, seller_id: seller.id })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

