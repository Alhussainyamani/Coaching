import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { z } from 'zod'

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().optional(),
  locale: z.string().optional(),
  profileData: z.record(z.string(), z.unknown()).optional(),
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

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase
    let query = serviceClient
      .from('users')
      .select('id, email, first_name, last_name, role, avatar_url, locale, created_at, updated_at')

    // Filter based on user role and access
    if (user.role === 'coach') {
      // Coaches can only see their athletes
      const { data: links } = await serviceClient
        .from('coach_athlete_links')
        .select('athlete_id')
        .eq('coach_id', user.id)
        .eq('status', 'active')

      const athleteIds = links?.map(link => link.athlete_id) || []
      if (athleteIds.length > 0) {
        query = query.in('id', athleteIds)
      } else {
        return NextResponse.json({ users: [] })
      }
    } else if (user.role === 'athlete') {
      // Athletes can only see themselves and their coaches
      const { data: links } = await serviceClient
        .from('coach_athlete_links')
        .select('coach_id')
        .eq('athlete_id', user.id)
        .eq('status', 'active')

      const coachIds = links?.map(link => link.coach_id) || []
      const allowedIds = [user.id, ...coachIds]
      query = query.in('id', allowedIds)
    }
    // Admin can see all users (no filter)

    if (role && ['athlete', 'coach', 'admin'].includes(role)) {
      query = query.eq('role', role as 'athlete' | 'coach' | 'admin')
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: data })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id
    
    // Check permissions
    if (user.role !== 'admin' && userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, avatarUrl, locale, profileData } = updateUserSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
    if (locale !== undefined) updateData.locale = locale
    if (profileData !== undefined) updateData.profile_data = profileData

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase
    const { data, error } = await serviceClient
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}
