'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  totalPrograms: number
  totalMessages: number
  activeUsersToday: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPrograms: 0,
    totalMessages: 0,
    activeUsersToday: 0
  })
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const [usersResult, programsResult, messagesResult] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('programs').select('id', { count: 'exact' }),
          supabase.from('messages').select('id', { count: 'exact' })
        ])

        setStats({
          totalUsers: usersResult.count || 0,
          totalPrograms: programsResult.count || 0,
          totalMessages: messagesResult.count || 0,
          activeUsersToday: 0 // TODO: Implement active users logic
        })

        // Fetch recent user registrations
        const { data: recentUsers } = await supabase
          .from('users')
          .select('id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        const activities: RecentActivity[] = (recentUsers || []).map(user => ({
          id: user.id,
          type: 'user_registration',
          description: `New user registered: ${user.email}`,
          timestamp: user.created_at || new Date().toISOString()
        }))

        setRecentActivities(activities)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsersToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest user registrations and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.timestamp ? formatRelativeTime(activity.timestamp) : 'Unknown'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
