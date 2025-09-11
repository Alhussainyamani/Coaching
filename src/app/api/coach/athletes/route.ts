import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    const coachId = searchParams.get('coachId') || user.id

    // Verify permissions
    if (user.role === 'coach' && coachId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('coach_athlete_links')
      .select(`
        *,
        athlete:athlete_id(id, first_name, last_name, email, avatar_url, created_at)
      `)
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const athletes = data?.map(link => link.athlete) || []

    return NextResponse.json({ data: athletes })
  } catch (error) {
    console.error('Get coach athletes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


