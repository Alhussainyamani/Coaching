import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Service role client for API operations
const getSupabaseService = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return null
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
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

    const serviceClient = getSupabaseService() || supabase
    const activities = []

    // Get recent messages (as activities)
    const { data: recentMessages } = await serviceClient
      .from('messages')
      .select(`
        id, text, created_at, sender_id,
        sender:users!messages_sender_id_fkey(first_name, last_name),
        thread:threads!messages_thread_id_fkey(coach_id, athlete_id)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Transform messages to activities
    if (recentMessages) {
      for (const message of recentMessages) {
        const isUserMessage = message.sender_id === user.id
        if (!isUserMessage) {
          const senderName = `${message.sender?.first_name || ''} ${message.sender?.last_name || ''}`.trim()
          activities.push({
            id: message.id,
            type: 'message',
            title: user.role === 'coach' ? 'رسالة جديدة من رياضي' : 'رسالة من المدرب',
            subtitle: message.text || 'رسالة جديدة',
            time: message.created_at,
            icon: 'message',
            color: 'secondary',
            data: { messageId: message.id, senderId: message.sender_id, senderName }
          })
        }
      }
    }

    // Get recent check-ins (as activities)  
    if (user.role === 'coach') {
      const { data: recentCheckIns } = await serviceClient
        .from('checkins')
        .select(`
          id, created_at, athlete_id,
          athlete:users!checkins_athlete_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentCheckIns) {
        for (const checkIn of recentCheckIns) {
          const athleteName = `${checkIn.athlete?.first_name || ''} ${checkIn.athlete?.last_name || ''}`.trim()
          activities.push({
            id: checkIn.id,
            type: 'checkin',
            title: 'تسجيل دخول يومي',
            subtitle: `${athleteName} سجل بياناته اليومية`,
            time: checkIn.created_at,
            icon: 'assignment_turned_in',
            color: 'warning',
            data: { checkInId: checkIn.id, athleteId: checkIn.athlete_id, athleteName }
          })
        }
      }
    }

    // Get new user registrations (for coaches)
    if (user.role === 'coach') {
      const { data: newAthletes } = await serviceClient
        .from('users')
        .select('id, first_name, last_name, created_at')
        .eq('role', 'athlete')
        .order('created_at', { ascending: false })
        .limit(3)

      if (newAthletes) {
        for (const athlete of newAthletes) {
          const athleteName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim()
          activities.push({
            id: athlete.id,
            type: 'new_user',
            title: 'رياضي جديد انضم',
            subtitle: `${athleteName} انضم إلى برنامجك`,
            time: athlete.created_at,
            icon: 'person_add',
            color: 'success',
            data: { userId: athlete.id, userName: athleteName }
          })
        }
      }
    }

    // Sort all activities by time (most recent first)
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    // Limit to 5 most recent activities
    const recentActivities = activities.slice(0, 5)

    return NextResponse.json({ data: recentActivities })
  } catch (error) {
    console.error('Get activities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
