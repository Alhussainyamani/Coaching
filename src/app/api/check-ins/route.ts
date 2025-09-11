import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createCheckInSchema = z.object({
  bodyweight: z.number().positive().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  mood: z.number().min(1).max(10).optional(),
  energy: z.number().min(1).max(10).optional(),
  steps: z.number().min(0).optional(),
  liquidsML: z.number().min(0).optional(),
  notes: z.string().optional(),
  measurements: z.record(z.string(), z.unknown()).optional(),
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

  // Get user profile
  const { data: profile } = await supabase
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
    const athleteId = searchParams.get('athleteId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '30')

    let query = supabase
      .from('check_ins')
      .select(`
        *,
        athlete:athlete_id(id, first_name, last_name, email, avatar_url)
      `)

    // Filter based on user role and parameters
    if (user.role === 'athlete') {
      query = query.eq('athlete_id', user.id)
    } else if (user.role === 'coach') {
      if (athleteId) {
        // Verify coach has access to this athlete
        const { data: link } = await supabase
          .from('coach_athlete_links')
          .select('*')
          .eq('coach_id', user.id)
          .eq('athlete_id', athleteId)
          .eq('status', 'active')
          .single()

        if (!link) {
          return NextResponse.json(
            { error: 'Access denied to athlete data' },
            { status: 403 }
          )
        }
        query = query.eq('athlete_id', athleteId)
      } else {
        // Get all athletes for this coach
        const { data: links } = await supabase
          .from('coach_athlete_links')
          .select('athlete_id')
          .eq('coach_id', user.id)
          .eq('status', 'active')

        const athleteIds = links?.map(link => link.athlete_id) || []
        if (athleteIds.length > 0) {
          query = query.in('athlete_id', athleteIds)
        } else {
          return NextResponse.json({ checkIns: [] })
        }
      }
    }
    // Admin can see all check-ins (no additional filter)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ checkIns: data })
  } catch (error) {
    console.error('Get check-ins error:', error)
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

    if (user.role !== 'athlete') {
      return NextResponse.json(
        { error: 'Only athletes can create check-ins' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bodyweight, sleepHours, mood, energy, steps, liquidsML, notes, measurements } = createCheckInSchema.parse(body)

    // Check if user already checked in today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingCheckIn } = await supabase
      .from('check_ins')
      .select('id')
      .eq('athlete_id', user.id)
      .eq('date', today)
      .single()

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'Check-in already completed for today' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        athlete_id: user.id,
        date: today,
        bodyweight,
        sleep_hours: sleepHours,
        mood,
        energy,
        steps,
        liquids_ml: liquidsML,
        notes,
        measurements: measurements ? JSON.parse(JSON.stringify(measurements)) : null,
      })
      .select(`
        *,
        athlete:athlete_id(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ checkIn: data })
  } catch (error) {
    console.error('Create check-in error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}
