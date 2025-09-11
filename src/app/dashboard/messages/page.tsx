'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreHorizontal, 
  MessageSquare,
  Eye,
  Trash2,
  Ban,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

interface ThreadWithUsers {
  id: string
  coach_id: string
  athlete_id: string
  last_message_at: string | null
  coach_unread_count: number | null
  athlete_unread_count: number | null
  created_at: string | null
  coach: {
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  } | null
  athlete: {
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  } | null
  latest_message: {
    text: string | null
    sender_id: string
    created_at: string | null
  } | null
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<ThreadWithUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          coach:users!coach_id(first_name, last_name, email, avatar_url),
          athlete:users!athlete_id(first_name, last_name, email, avatar_url)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      // Get the latest message for each thread
      const threadsWithLatest = await Promise.all(
        (data || []).map(async (thread) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('text, sender_id, created_at')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...thread,
            latest_message: messages?.[0] || null
          }
        })
      )

      setThreads(threadsWithLatest as ThreadWithUsers[])
    } catch (error) {
      toast.error('Failed to fetch conversations')
      console.error('Error fetching threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId)

      if (error) throw error

      setThreads(threads.filter(thread => thread.id !== threadId))
      toast.success('Conversation deleted successfully')
    } catch (error) {
      toast.error('Failed to delete conversation')
      console.error('Error deleting thread:', error)
    }
  }

  const filteredThreads = threads.filter(thread => {
    const coachName = thread.coach 
      ? `${thread.coach.first_name || ''} ${thread.coach.last_name || ''}`.toLowerCase()
      : ''
    const athleteName = thread.athlete 
      ? `${thread.athlete.first_name || ''} ${thread.athlete.last_name || ''}`.toLowerCase()
      : ''
    const coachEmail = thread.coach?.email.toLowerCase() || ''
    const athleteEmail = thread.athlete?.email.toLowerCase() || ''
    
    const search = searchTerm.toLowerCase()
    
    return coachName.includes(search) || 
           athleteName.includes(search) || 
           coachEmail.includes(search) || 
           athleteEmail.includes(search)
  })

  const getUserName = (user: { first_name?: string | null; last_name?: string | null; email?: string | null } | null) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.email || 'Unknown User'
  }

  const getUserInitials = (user: { first_name?: string | null; last_name?: string | null; email?: string | null } | null) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || '?'
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor conversations between coaches and athletes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            {threads.length} Conversations
          </Badge>
        </div>
      </div>

      {/* Messages Management */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>
            View and moderate conversations between coaches and athletes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations by participant name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Conversations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participants</TableHead>
                  <TableHead>Latest Message</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Unread</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThreads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No conversations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredThreads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell>
                        <div className="flex items-center space-x-4">
                          {/* Coach */}
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={thread.coach?.avatar_url || undefined} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {getUserInitials(thread.coach)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">
                                {getUserName(thread.coach)}
                              </div>
                              <div className="text-xs text-gray-500">Coach</div>
                            </div>
                          </div>
                          
                          <div className="text-gray-400">↔</div>
                          
                          {/* Athlete */}
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={thread.athlete?.avatar_url || undefined} />
                              <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                {getUserInitials(thread.athlete)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">
                                {getUserName(thread.athlete)}
                              </div>
                              <div className="text-xs text-gray-500">Athlete</div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {thread.latest_message ? (
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-900 dark:text-white truncate">
                              {thread.latest_message.text || 'Attachment'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {thread.latest_message.created_at ? formatRelativeTime(thread.latest_message.created_at) : 'Unknown'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No messages yet</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {thread.last_message_at 
                              ? formatRelativeTime(thread.last_message_at)
                              : 'No activity'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {(thread.coach_unread_count ?? 0) > 0 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Coach: {thread.coach_unread_count}
                            </Badge>
                          )}
                          {(thread.athlete_unread_count ?? 0) > 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Athlete: {thread.athlete_unread_count}
                            </Badge>
                          )}
                          {(thread.coach_unread_count ?? 0) === 0 && (thread.athlete_unread_count ?? 0) === 0 && (
                            <span className="text-sm text-gray-500">All read</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Conversation
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Ban className="mr-2 h-4 w-4" />
                              Moderate Content
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteThread(thread.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {filteredThreads.length} of {threads.length} conversations
            </span>
            <div className="flex items-center space-x-4">
              <span>
                {threads.reduce((acc, thread) => acc + (thread.coach_unread_count ?? 0) + (thread.athlete_unread_count ?? 0), 0)} Unread Messages
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
