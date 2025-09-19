import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

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
    const serviceClient = getSupabaseService() || supabase
    const { data: { user }, error } = await serviceClient.auth.getUser(token)
    if (error || !user) {
      return null
    }

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

function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const csvRows = []
  
  // Add headers
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'users'
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const serviceClient = getSupabaseService() || supabase
    let data: Record<string, unknown>[] = []
    let headers: string[] = []
    let filename = ''

    switch (reportType) {
      case 'users':
        const { data: userData } = await serviceClient
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
        
        data = userData || []
        headers = ['id', 'email', 'first_name', 'last_name', 'role', 'created_at', 'updated_at']
        filename = `users_report_${new Date().toISOString().split('T')[0]}`
        break

      case 'checkins':
        let checkInQuery = serviceClient
          .from('check_ins')
          .select(`
            *,
            athlete:users!athlete_id(first_name, last_name, email)
          `)
          .order('date', { ascending: false })

        if (startDate) {
          checkInQuery = checkInQuery.gte('date', startDate)
        }
        if (endDate) {
          checkInQuery = checkInQuery.lte('date', endDate)
        }

        const { data: checkInData } = await checkInQuery
        
        data = (checkInData || []).map(item => ({
          id: item.id,
          athlete_name: `${item.athlete?.first_name || ''} ${item.athlete?.last_name || ''}`.trim(),
          athlete_email: item.athlete?.email,
          date: item.date,
          bodyweight: item.bodyweight,
          sleep_hours: item.sleep_hours,
          steps: item.steps,
          mood: item.mood,
          energy: item.energy,
          notes: item.notes,
          created_at: item.created_at
        }))
        
        headers = ['id', 'athlete_name', 'athlete_email', 'date', 'bodyweight', 'sleep_hours', 'steps', 'mood', 'energy', 'notes', 'created_at']
        filename = `checkins_report_${new Date().toISOString().split('T')[0]}`
        break

      case 'programs':
        const { data: programData } = await serviceClient
          .from('programs')
          .select(`
            *,
            athlete:users!athlete_id(first_name, last_name, email),
            coach:users!coach_id(first_name, last_name, email),
            template:templates(title)
          `)
          .order('created_at', { ascending: false })
        
        data = (programData || []).map(item => {
          const now = new Date()
          const startDate = new Date(item.start_date)
          const endDate = item.end_date ? new Date(item.end_date) : null
          
          let status = 'active'
          if (endDate && endDate < now) {
            status = 'completed'
          } else if (startDate > now) {
            status = 'upcoming'
          }
          
          return {
            id: item.id,
            name: item.title,
            athlete_name: `${item.athlete?.first_name || ''} ${item.athlete?.last_name || ''}`.trim(),
            athlete_email: item.athlete?.email,
            coach_name: `${item.coach?.first_name || ''} ${item.coach?.last_name || ''}`.trim(),
            coach_email: item.coach?.email,
            template_name: item.template?.title,
            start_date: item.start_date,
            end_date: item.end_date,
            status,
            created_at: item.created_at
          }
        })
        
        headers = ['id', 'name', 'athlete_name', 'athlete_email', 'coach_name', 'coach_email', 'template_name', 'start_date', 'end_date', 'status', 'created_at']
        filename = `programs_report_${new Date().toISOString().split('T')[0]}`
        break

      case 'messages':
        let messageQuery = serviceClient
          .from('messages')
          .select(`
            *,
            sender:users!sender_id(first_name, last_name, email),
            thread:threads(id, athlete_id, coach_id)
          `)
          .order('created_at', { ascending: false })

        if (startDate) {
          messageQuery = messageQuery.gte('created_at', startDate)
        }
        if (endDate) {
          messageQuery = messageQuery.lte('created_at', endDate)
        }

        const { data: messageData } = await messageQuery
        
        data = (messageData || []).map(item => ({
          id: item.id,
          sender_name: `${item.sender?.first_name || ''} ${item.sender?.last_name || ''}`.trim(),
          sender_email: item.sender?.email,
          text: item.text || '[Attachment only]',
          thread_id: item.thread_id,
          created_at: item.created_at
        }))
        
        headers = ['id', 'sender_name', 'sender_email', 'text', 'thread_id', 'created_at']
        filename = `messages_report_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    if (format === 'csv') {
      const csvContent = generateCSV(data, headers)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    } else if (format === 'json') {
      return NextResponse.json({
        data,
        meta: {
          total: data.length,
          reportType,
          generatedAt: new Date().toISOString(),
          dateRange: startDate && endDate ? { startDate, endDate } : null
        }
      })
    }

    return NextResponse.json(
      { error: 'Unsupported export format' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
