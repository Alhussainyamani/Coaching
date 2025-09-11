import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createTemplateSchema = z.object({
  coachId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['strength', 'nutrition', 'rehab']),
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
    const coachId = searchParams.get('coachId')

    let query = supabase
      .from('templates')
      .select('*')

    // Filter based on user role
    if (user.role === 'coach') {
      query = query.eq('coach_id', user.id)
    } else if (coachId && user.role === 'admin') {
      query = query.eq('coach_id', coachId)
    }
    // Admin without coachId sees all templates

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data })
  } catch (error) {
    console.error('Get templates error:', error)
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
        { error: 'Only coaches can create templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { coachId, title, description, type } = createTemplateSchema.parse(body)

    const { data, error } = await supabase
      .from('templates')
      .insert({
        coach_id: coachId,
        title,
        description,
        type,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}


