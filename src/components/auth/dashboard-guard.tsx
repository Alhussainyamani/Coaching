'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface DashboardGuardProps {
  children: React.ReactNode
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('DashboardGuard: No session, redirecting to login')
          router.replace('/login')
          return
        }

        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError || !userData || userData.role !== 'admin') {
          console.log('DashboardGuard: User is not admin, redirecting to login')
          router.replace('/login')
          return
        }

        console.log('DashboardGuard: User authenticated and is admin')
        setIsAuthenticated(true)
        setIsAdmin(true)
      } catch (error) {
        console.error('DashboardGuard: Auth check failed:', error)
        router.replace('/login')
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        router.replace('/login')
      } else if (event === 'SIGNED_IN') {
        checkAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (isAuthenticated === null || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null // Will redirect
  }

  return <>{children}</>
}


