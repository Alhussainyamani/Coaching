import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const linkAthleteSchema = z.object({
  coachId: z.string().uuid(),
  athleteEmail: z.string().email(),
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
        { error: 'Only coaches can link athletes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { coachId, athleteEmail } = linkAthleteSchema.parse(body)

    // Verify coach permissions
    if (user.role === 'coach' && coachId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Find athlete by email
    const { data: athlete, error: athleteError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', athleteEmail)
      .eq('role', 'athlete')
      .single()

    if (athleteError || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('coach_athlete_links')
      .select('id, status')
      .eq('coach_id', coachId)
      .eq('athlete_id', athlete.id)
      .single()

    if (existingLink) {
      if (existingLink.status === 'active') {
        return NextResponse.json(
          { error: 'Athlete already linked to this coach' },
          { status: 400 }
        )
      } else {
        // Reactivate existing link
        const { data, error } = await supabase
          .from('coach_athlete_links')
          .update({ status: 'active' })
          .eq('id', existingLink.id)
          .select()
          .single()

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ link: data })
      }
    }

    // Create new link
    const { data, error } = await supabase
      .from('coach_athlete_links')
      .insert({
        coach_id: coachId,
        athlete_id: athlete.id,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ link: data })
  } catch (error) {
    console.error('Link athlete error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}


