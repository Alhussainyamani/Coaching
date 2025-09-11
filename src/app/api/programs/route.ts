import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { z } from 'zod'

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

const createProgramSchema = z.object({
  athleteId: z.string().uuid(),
  coachId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
})

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

  // Get user profile using service role to bypass RLS
  const supabaseService = getSupabaseService()
  const { data: profile } = await (supabaseService || supabase)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const userId = searchParams.get('userId') || user.id

    const supabaseService = getSupabaseService()
    let query = (supabaseService || supabase)
      .from('programs')
      .select(`
        *,
        coach:users!coach_id(id, first_name, last_name, email, avatar_url),
        athlete:users!athlete_id(id, first_name, last_name, email, avatar_url),
        template:templates!template_id(id, title, description, type)
      `)

    // Filter based on user role
    if (user.role === 'athlete') {
      query = query.eq('athlete_id', user.id)
    } else if (user.role === 'coach') {
      query = query.eq('coach_id', user.id)
    }
    // Admin can see all programs (no additional filter)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data })
  } catch (error) {
    console.error('Get programs error:', error)
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

    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches can create programs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { athleteId, coachId, templateId, title, startDate, endDate, notes } = 
      createProgramSchema.parse(body)

    const supabaseService = getSupabaseService()
    const { data, error } = await (supabaseService || supabase)
      .from('programs')
      .insert({
        athlete_id: athleteId,
        coach_id: coachId,
        template_id: templateId,
        title,
        start_date: startDate,
        end_date: endDate,
        notes,
      })
      .select(`
        *,
        coach:users!coach_id(id, first_name, last_name, email, avatar_url),
        athlete:users!athlete_id(id, first_name, last_name, email, avatar_url),
        template:templates!template_id(id, title, description, type)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}
