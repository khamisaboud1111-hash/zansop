export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ALLOWED_BUCKETS = ['product-images', 'seller-logos', 'seller-banners', 'avatars'] as const

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

const MAX_FILE_SIZES: Record<string, number> = {
  'product-images': 5 * 1024 * 1024,    // 5 MB
  'seller-logos': 2 * 1024 * 1024,      // 2 MB
  'seller-banners': 5 * 1024 * 1024,    // 5 MB
  'avatars': 2 * 1024 * 1024,           // 2 MB
}

const UploadBodySchema = z.object({
  bucket: z.enum(ALLOWED_BUCKETS),
  folder: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  filename: z.string().max(255).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null
  const folder = formData.get('folder') as string | null

  if (!file || !bucket) {
    return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 })
  }

  // Validate bucket
  if (!ALLOWED_BUCKETS.includes(bucket as any)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // Validate file size
  const maxSize = MAX_FILE_SIZES[bucket]
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File exceeds ${maxSize / 1024 / 1024}MB limit for ${bucket}` }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return NextResponse.json({ error: 'File type not allowed. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
  }

  // Validate file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExts: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
  }
  if (ext && allowedExts[file.type] && !allowedExts[file.type].includes(ext)) {
    return NextResponse.json({ error: 'File extension does not match content type' }, { status: 400 })
  }

  // Validate folder parameter
  if (folder && !/^[a-zA-Z0-9_-]+$/.test(folder)) {
    return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 })
  }

  // Use admin client for upload to bypass RLS (already validated user)
  const adminSupabase = createAdminClient()

  // Generate safe filename
  const safeExt = ext && ALLOWED_MIME_TYPES.includes(file.type as any) && ext
    ? ext
    : (file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'gif')
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const safeFolder = folder ?? user.id
  const path = `${safeFolder}/${timestamp}-${randomSuffix}.${safeExt}`

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload with admin client (bypasses RLS, we already validated user)
  const { data, error } = await adminSupabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    console.error('[upload] Storage error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: urlData } = adminSupabase.storage.from(bucket).getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl, path: data.path })
}

