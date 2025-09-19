import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

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
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  // Use service role client to bypass RLS when checking user profile
  const serviceClient = getSupabaseService()
  if (!serviceClient) {
    return null
  }

  // Get user profile with role using service client
  const { data: profile } = await serviceClient
    .from('users')
    .select('id, email, role, first_name, last_name')
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

    // Only allow admin access
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied - Admin only' },
        { status: 403 }
      )
    }

    // Use service client to bypass RLS and get ALL threads
    const serviceClient = getSupabaseService()
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    // Get all threads with coach and athlete details
    const { data: threads, error } = await serviceClient
      .from('threads')
      .select(`
        *,
        coach:users!threads_coach_id_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
        athlete:users!threads_athlete_id_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching admin threads:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Fetch latest message for each thread
    const threadsWithLatestMessage = await Promise.all(
      (threads || []).map(async (thread) => {
        const { data: latestMessages } = await serviceClient
          .from('messages')
          .select(`
            id, text, created_at, sender_id,
            sender:users!messages_sender_id_fkey(id, first_name, last_name, email, avatar_url)
          `)
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        const latestMessage = latestMessages && latestMessages.length > 0 ? latestMessages[0] : null

        // Get message count for each thread
        const { count: messageCount } = await serviceClient
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)

        return {
          ...thread,
          latest_message: latestMessage || null,
          message_count: messageCount || 0
        }
      })
    )

    return NextResponse.json({ 
      data: threadsWithLatestMessage,
      total: threadsWithLatestMessage.length 
    })
  } catch (error) {
    console.error('Admin messages endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
