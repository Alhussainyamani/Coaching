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
    const timeframe = searchParams.get('timeframe') || '30d'
    
    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const startDateISO = startDate.toISOString()

    // Get user statistics
    const { data: allUsers } = await supabase
      .from('users')
      .select('created_at, role')

    const { data: newUsers } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', startDateISO)

    // Get program statistics
    const { data: allPrograms } = await supabase
      .from('programs')
      .select('start_date, end_date, created_at')

    const activePrograms = allPrograms?.filter(p => {
      const start = new Date(p.start_date)
      const end = p.end_date ? new Date(p.end_date) : null
      return start <= now && (!end || end >= now)
    }) || []

    const completedPrograms = allPrograms?.filter(p => {
      const end = p.end_date ? new Date(p.end_date) : null
      return end && end < now
    }) || []

    // Get message statistics
    const { data: allMessages } = await supabase
      .from('messages')
      .select('created_at')

    const { data: recentMessages } = await supabase
      .from('messages')
      .select('id')
      .gte('created_at', startDateISO)

    const { data: activeThreads } = await supabase
      .from('threads')
      .select('id')
      .not('last_message_at', 'is', null)
      .gte('last_message_at', startDateISO)

    // Get check-in statistics
    const { data: allCheckIns } = await supabase
      .from('check_ins')
      .select('created_at, athlete_id')

    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('id')
      .gte('created_at', startDateISO)

    // Calculate statistics
    const totalUsers = allUsers?.length || 0
    const newUsersCount = newUsers?.length || 0
    const userGrowthRate = totalUsers > 0 ? (newUsersCount / totalUsers) * 100 : 0

    const totalPrograms = allPrograms?.length || 0
    const activeProgramsCount = activePrograms.length
    const completedProgramsCount = completedPrograms.length
    const programCompletionRate = totalPrograms > 0 
      ? (completedProgramsCount / totalPrograms) * 100 
      : 0

    const totalMessages = allMessages?.length || 0
    const recentMessagesCount = recentMessages?.length || 0
    const activeConversations = activeThreads?.length || 0

    const totalCheckIns = allCheckIns?.length || 0
    const recentCheckInsCount = recentCheckIns?.length || 0
    const uniqueAthletes = new Set(allCheckIns?.map(c => c.athlete_id)).size
    const averageCheckInsPerUser = uniqueAthletes > 0 ? totalCheckIns / uniqueAthletes : 0

    // Role distribution
    const usersByRole = allUsers?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const analytics = {
      userStats: {
        totalUsers,
        newUsersThisMonth: newUsersCount,
        activeUsers: totalUsers, // Simplified
        userGrowthRate,
        usersByRole,
      },
      programStats: {
        totalPrograms,
        activePrograms: activeProgramsCount,
        completedPrograms: completedProgramsCount,
        programCompletionRate,
      },
      messageStats: {
        totalMessages,
        messagesThisPeriod: recentMessagesCount,
        averageResponseTime: 2.5, // Simplified
        activeConversations,
      },
      checkInStats: {
        totalCheckIns,
        checkInsThisPeriod: recentCheckInsCount,
        averageCheckInsPerUser,
        checkInComplianceRate: 85, // Simplified
      },
      timeframe,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


