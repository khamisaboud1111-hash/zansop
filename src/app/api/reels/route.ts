export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const cursor = searchParams.get('cursor') || null
    const hashtag = searchParams.get('hashtag') || null
    const sellerId = searchParams.get('sellerId') || null

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.rpc('get_reels_feed', {
      p_limit: limit,
      p_cursor: cursor,
      p_hashtag: hashtag,
      p_seller_id: sellerId
    })

    if (error) {
      console.error('Reels feed error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const reels = data ?? []
    const nextCursor = reels.length === limit ? reels[reels.length - 1]?.created_at : null

    return NextResponse.json({ reels, nextCursor })
  } catch (error) {
    console.error('Reels feed API error:', error)
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

    const body = await request.json()
    const { action, videoId, body: commentBody, parentId } = body

    switch (action) {
      case 'like': {
        if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
        const { data, error } = await supabase.rpc('toggle_video_like', { p_video_id: videoId })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }

      case 'view': {
        if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
        const watchDuration = body.watchDuration || 0
        const { data, error } = await supabase.rpc('record_video_view', {
          p_video_id: videoId,
          p_watch_duration_seconds: watchDuration
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }

      case 'comment': {
        if (!videoId || !commentBody) return NextResponse.json({ error: 'Video ID and body required' }, { status: 400 })
        const { data, error } = await supabase.rpc('add_video_comment', {
          p_video_id: videoId,
          p_body: commentBody,
          p_parent_id: parentId || null
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Reels action API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

