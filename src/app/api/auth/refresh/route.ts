import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const refreshSchema = z.object({
  refresh_token: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refresh_token } = refreshSchema.parse(body)

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}


