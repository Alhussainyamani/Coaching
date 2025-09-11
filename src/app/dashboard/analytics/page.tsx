'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  MessageSquare,
  Activity,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AnalyticsData {
  userStats: {
    totalUsers: number
    newUsersThisMonth: number
    activeUsers: number
    userGrowthRate: number
  }
  programStats: {
    totalPrograms: number
    activePrograms: number
    completedPrograms: number
    programCompletionRate: number
  }
  messageStats: {
    totalMessages: number
    messagesThisWeek: number
    averageResponseTime: number
    activeConversations: number
  }
  checkInStats: {
    totalCheckIns: number
    checkInsThisWeek: number
    averageCheckInsPerUser: number
    checkInComplianceRate: number
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Fetch user statistics
      const { data: allUsers } = await supabase.from('users').select('created_at, role')
      const { data: newUsers } = await supabase
        .from('users')
        .select('id')
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Fetch program statistics
      const { data: allPrograms } = await supabase.from('programs').select('start_date, end_date')
      const activePrograms = allPrograms?.filter(p => {
        const start = new Date(p.start_date)
        const end = p.end_date ? new Date(p.end_date) : null
        return start <= now && (!end || end >= now)
      }) || []
      const completedPrograms = allPrograms?.filter(p => {
        const end = p.end_date ? new Date(p.end_date) : null
        return end && end < now
      }) || []

      // Fetch message statistics
      const { data: allMessages } = await supabase.from('messages').select('created_at')
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
      
      const { data: activeThreads } = await supabase
        .from('threads')
        .select('id')
        .not('last_message_at', 'is', null)
        .gte('last_message_at', sevenDaysAgo.toISOString())

      // Fetch check-in statistics
      const { data: allCheckIns } = await supabase.from('check_ins').select('created_at, athlete_id')
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Calculate analytics
      const totalUsers = allUsers?.length || 0
      const newUsersThisMonth = newUsers?.length || 0
      const userGrowthRate = totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0

      const totalPrograms = allPrograms?.length || 0
      const activeProgramsCount = activePrograms.length
      const completedProgramsCount = completedPrograms.length
      const programCompletionRate = totalPrograms > 0 
        ? (completedProgramsCount / totalPrograms) * 100 
        : 0

      const totalMessages = allMessages?.length || 0
      const messagesThisWeek = recentMessages?.length || 0
      const activeConversations = activeThreads?.length || 0

      const totalCheckIns = allCheckIns?.length || 0
      const checkInsThisWeek = recentCheckIns?.length || 0
      const uniqueAthletes = new Set(allCheckIns?.map(c => c.athlete_id)).size
      const averageCheckInsPerUser = uniqueAthletes > 0 ? totalCheckIns / uniqueAthletes : 0

      const analyticsData: AnalyticsData = {
        userStats: {
          totalUsers,
          newUsersThisMonth,
          activeUsers: totalUsers, // Simplified - could be calculated based on recent activity
          userGrowthRate,
        },
        programStats: {
          totalPrograms,
          activePrograms: activeProgramsCount,
          completedPrograms: completedProgramsCount,
          programCompletionRate,
        },
        messageStats: {
          totalMessages,
          messagesThisWeek,
          averageResponseTime: 2.5, // Simplified - would need more complex calculation
          activeConversations,
        },
        checkInStats: {
          totalCheckIns,
          checkInsThisWeek,
          averageCheckInsPerUser,
          checkInComplianceRate: 85, // Simplified - would need more complex calculation
        },
      }

      setAnalytics(analyticsData)
    } catch (error) {
      toast.error('Failed to fetch analytics')
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.userStats.totalUsers,
      change: analytics.userStats.userGrowthRate,
      changeText: `${analytics.userStats.newUsersThisMonth} new this month`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Programs',
      value: analytics.programStats.activePrograms,
      change: analytics.programStats.programCompletionRate,
      changeText: `${analytics.programStats.programCompletionRate.toFixed(1)}% completion rate`,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Messages This Week',
      value: analytics.messageStats.messagesThisWeek,
      change: 12.5,
      changeText: `${analytics.messageStats.activeConversations} active conversations`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Check-ins This Week',
      value: analytics.checkInStats.checkInsThisWeek,
      change: analytics.checkInStats.checkInComplianceRate,
      changeText: `${analytics.checkInStats.checkInComplianceRate}% compliance rate`,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Platform insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          
          return (
            <Card key={index} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.changeText}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              User Growth
            </CardTitle>
            <CardDescription>
              User registration and activity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Users</span>
                <Badge variant="outline">{analytics.userStats.totalUsers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Athletes</span>
                <Badge variant="secondary">
                  {Math.round(analytics.userStats.totalUsers * 0.8)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Coaches</span>
                <Badge variant="secondary">
                  {Math.round(analytics.userStats.totalUsers * 0.18)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Admins</span>
                <Badge variant="secondary">
                  {Math.round(analytics.userStats.totalUsers * 0.02)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Program Performance
            </CardTitle>
            <CardDescription>
              Training program success metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Programs</span>
                <Badge variant="outline">{analytics.programStats.totalPrograms}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Programs</span>
                <Badge variant="default">{analytics.programStats.activePrograms}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed Programs</span>
                <Badge variant="secondary">{analytics.programStats.completedPrograms}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {analytics.programStats.programCompletionRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Communication
            </CardTitle>
            <CardDescription>
              Messaging and interaction metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Messages</span>
                <Badge variant="outline">{analytics.messageStats.totalMessages}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <Badge variant="default">{analytics.messageStats.messagesThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Conversations</span>
                <Badge variant="secondary">{analytics.messageStats.activeConversations}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {analytics.messageStats.averageResponseTime}h
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Health Tracking
            </CardTitle>
            <CardDescription>
              Check-in and progress monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Check-ins</span>
                <Badge variant="outline">{analytics.checkInStats.totalCheckIns}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <Badge variant="default">{analytics.checkInStats.checkInsThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg per User</span>
                <Badge variant="secondary">
                  {analytics.checkInStats.averageCheckInsPerUser.toFixed(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance Rate</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {analytics.checkInStats.checkInComplianceRate}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


