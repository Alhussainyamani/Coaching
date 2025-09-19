import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { z } from 'zod'

const sendMessageSchema = z.object({
  text: z.string().optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'video', 'file']),
    storage_path: z.string(),
    file_name: z.string(),
    file_size: z.number().optional(),
    mime_type: z.string().optional(),
    duration_seconds: z.number().optional(),
  })).nullable().default([]),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { threadId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase

    // Verify user has access to this thread
    const { data: thread, error: threadError } = await serviceClient
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'admin' && 
        thread.coach_id !== user.id && 
        thread.athlete_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get messages with attachments
    const { data: messages, error } = await serviceClient
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, first_name, last_name, email, avatar_url),
        attachments:message_attachments(*)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Mark messages as read
    const unreadColumn = user.role === 'coach' ? 'coach_unread_count' : 'athlete_unread_count'
    await serviceClient
      .from('threads')
      .update({ [unreadColumn]: 0 })
      .eq('id', threadId)

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { threadId } = await params
    const body = await request.json()
    console.log('📤 DEBUG: Received message data:', body)
    
    try {
      const { text, attachments } = sendMessageSchema.parse(body)
      console.log('✅ DEBUG: Schema validation passed:', { text, attachments })
    } catch (error) {
      console.log('🚨 DEBUG: Schema validation failed:', error)
      return NextResponse.json(
        { error: 'Invalid request data', details: error instanceof Error ? error.message : String(error) },
        { status: 400 }
      )
    }
    
    const { text, attachments } = sendMessageSchema.parse(body)

    // A message must have either text OR attachments (or both)
    if ((!text || text.trim().length === 0) && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message must have text or attachments' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS
    const serviceClient = getSupabaseService() || supabase

    // Verify user has access to this thread
    const { data: thread, error: threadError } = await serviceClient
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    if (thread.coach_id !== user.id && thread.athlete_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create message
    const { data: message, error } = await serviceClient
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        text,
      })
      .select(`
        *,
        sender:sender_id(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Create attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentData = attachments.map(attachment => ({
        message_id: message.id,
        storage_path: attachment.storage_path,
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        type: attachment.type,
        duration_seconds: attachment.duration_seconds,
      }))

      const { error: attachmentError } = await serviceClient
        .from('message_attachments')
        .insert(attachmentData)

      if (attachmentError) {
        console.error('Attachment creation error:', attachmentError)
        // Don't fail the message creation, just log the error
      }
    }

    // Update thread counters
    const isCoach = user.id === thread.coach_id
    const unreadColumn = isCoach ? 'athlete_unread_count' : 'coach_unread_count'
    
    await serviceClient
      .from('threads')
      .update({
        last_message_at: new Date().toISOString(),
        [unreadColumn]: (thread[unreadColumn] ?? 0) + 1,
      })
      .eq('id', threadId)

    return NextResponse.json(message)
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}
