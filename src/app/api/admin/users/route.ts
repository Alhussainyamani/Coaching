import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types/database.types'

// Service role client for admin operations
const getSupabaseService = () => createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Regular client for auth verification
const supabase = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const serviceClient = getSupabaseService()
  const { data: profile } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// Validation schema for query parameters
const querySchema = z.object({
  role: z.enum(['athlete', 'coach', 'admin', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseService = getSupabaseService()

    // Verify user is admin
    const { data: adminUser, error: adminError } = await supabaseService
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Validate query parameters with Zod
    const { searchParams } = new URL(request.url)
    const validationResult = querySchema.safeParse({
      role: searchParams.get('role'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { role, limit, offset } = validationResult.data

    let query = supabaseService
      .from('users')
      .select(`
        id,
        email,
        role,
        first_name,
        last_name,
        avatar_url,
        locale,
        profile_data,
        created_at,
        updated_at
      `)

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    // Add ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseService
      .from('users')
      .select('*', { count: 'exact', head: true })

    const totalCount = countError ? 0 : count || 0

    return NextResponse.json({
      data: users || [],
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
