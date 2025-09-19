import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { z } from 'zod'

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.union([z.string().url(), z.null()]).optional(),
  locale: z.enum(['ar', 'en']).optional(),
  profileData: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
})

// Service role client for API operations
const supabaseService = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.split(' ')[1]
  
  // Just verify the token is valid, we'll use service role for profile lookup
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  return user
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await params
    
    // Users can only access their own profile unless they're admin
    const { data: requestingUserProfile } = await supabaseService
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (user.id !== userId && requestingUserProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Can only access your own profile' },
        { status: 403 }
      )
    }

    const { data: userProfile, error } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await params
    
    // Users can only update their own profile unless they're admin
    const { data: requestingUserProfile } = await supabaseService
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (user.id !== userId && requestingUserProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Can only update your own profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = updateUserSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.error('Validation failed:', JSON.stringify(validationResult.error.issues, null, 2))
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const updateData = validationResult.data
    
    // Build the update object with only provided fields
    const updates: Record<string, unknown> = {}
    
    if (updateData.firstName !== undefined) {
      updates.first_name = updateData.firstName
    }
    if (updateData.lastName !== undefined) {
      updates.last_name = updateData.lastName
    }
    if (updateData.avatarUrl !== undefined) {
      updates.avatar_url = updateData.avatarUrl
    }
    if (updateData.locale !== undefined) {
      updates.locale = updateData.locale
    }
    if (updateData.profileData !== undefined) {
      updates.profile_data = updateData.profileData
    }
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString()

    const { data: updatedUser, error } = await supabaseService
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('Update user error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


