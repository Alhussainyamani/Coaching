import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { z } from 'zod'

const createCheckInSchema = z.object({
  date: z.string().optional(),
  bodyweight: z.number().optional(),
  sleep_hours: z.number().optional(),
  steps: z.number().int().optional(),
  liquids_ml: z.number().int().optional(),
  mood: z.number().int().min(1).max(10).optional(),
  energy: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  measurements: z.record(z.string(), z.any()).optional(),
})

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

  const token = authorization.slice(7)
  
  try {
    // Use service client to get user by token
    const serviceClient = getSupabaseService() || supabase
    const { data: { user }, error } = await serviceClient.auth.getUser(token)
    if (error || !user) {
      return null
    }

    // Get user profile with role using service client
    const { data: profile } = await serviceClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
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

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase
    let query = serviceClient
      .from('check_ins')
      .select('*')
      .order('date', { ascending: false })

    // For athletes, only show their own check-ins
    if (user.role === 'athlete') {
      query = query.eq('athlete_id', user.id)
    } 
    // For coaches, allow filtering by athleteId
    else if (user.role === 'coach' && athleteId) {
      // Verify coach has access to this athlete
      const { data: link } = await serviceClient
        .from('coach_athlete_links')
        .select('*')
        .eq('coach_id', user.id)
        .eq('athlete_id', athleteId)
        .eq('status', 'active')
        .single()

      if (!link) {
        return NextResponse.json(
          { error: 'Access denied to this athlete' },
          { status: 403 }
        )
      }

      query = query.eq('athlete_id', athleteId)
    }
    // For admins, show all or filter by athleteId
    else if (user.role === 'admin' && athleteId) {
      query = query.eq('athlete_id', athleteId)
    }

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: checkIns, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: checkIns })
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

    const body = await request.json()
    const checkInData = createCheckInSchema.parse(body)

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase

    // Only athletes can create their own check-ins (or admin for any athlete)
    let athleteId = user.id
    if (user.role === 'admin' && body.athleteId) {
      athleteId = body.athleteId
    } else if (user.role !== 'athlete' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only athletes can create check-ins' },
        { status: 403 }
      )
    }

    // Check if check-in already exists for this date
    const checkDate = checkInData.date || new Date().toISOString().split('T')[0]
    const { data: existingCheckIn } = await serviceClient
      .from('check_ins')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('date', checkDate)
      .single()

    if (existingCheckIn) {
      // Update existing check-in
      const { data: updatedCheckIn, error } = await serviceClient
        .from('check_ins')
        .update({
          ...checkInData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCheckIn.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(updatedCheckIn)
    } else {
      // Create new check-in
      const { data: newCheckIn, error } = await serviceClient
        .from('check_ins')
        .insert([{
          athlete_id: athleteId,
          date: checkDate,
          ...checkInData,
        }])
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(newCheckIn)
    }
  } catch (error) {
    console.error('Create check-in error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}