import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { z } from 'zod'

const createThreadSchema = z.object({
  coachId: z.string().uuid(),
  athleteId: z.string().uuid(),
})

// Service role client for API operations
const getSupabaseService = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey === 'your_service_role_key_here') {
    console.warn('Service role key not configured, falling back to user context')
    return null
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  // Get user profile using service client to bypass RLS
  const serviceClient = getSupabaseService() || supabase
  const { data: profile } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase
    let query = serviceClient
      .from('threads')
      .select(`
        *,
        coach:coach_id(id, first_name, last_name, email, avatar_url),
        athlete:athlete_id(id, first_name, last_name, email, avatar_url)
      `)

    // Filter based on user role
    if (user.role === 'athlete') {
      query = query.eq('athlete_id', user.id)
    } else if (user.role === 'coach') {
      query = query.eq('coach_id', user.id)
    }
    // Admin can see all threads (no additional filter)

    const { data: threads, error } = await query.order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get latest message for each thread
    const threadsWithMessages = await Promise.all(
      (threads || []).map(async (thread) => {
        const { data: messages } = await serviceClient
          .from('messages')
          .select('id, text, sender_id, created_at, attachments')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          ...thread,
          latest_message: messages?.[0] || null
        }
      })
    )

    return NextResponse.json({ data: threadsWithMessages })
  } catch (error) {
    console.error('Get threads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { coachId, athleteId } = createThreadSchema.parse(body)

    // Verify user has permission to create this thread
    if (user.role !== 'admin' && user.id !== coachId && user.id !== athleteId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase

    // Check if thread already exists
    const { data: existingThread } = await serviceClient
      .from('threads')
      .select('id')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .single()

    if (existingThread) {
      return NextResponse.json({
        id: existingThread.id,
        coach_id: coachId,
        athlete_id: athleteId,
        existing: true
      })
    }

    // Create new thread
    const { data: thread, error } = await serviceClient
      .from('threads')
      .insert({
        coach_id: coachId,
        athlete_id: athleteId,
        coach_unread_count: 0,
        athlete_unread_count: 0,
      })
      .select(`
        *,
        coach:coach_id(id, first_name, last_name, email, avatar_url),
        athlete:athlete_id(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(thread)
  } catch (error) {
    console.error('Create thread error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}
