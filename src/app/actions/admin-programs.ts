'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase-server'

// Service role client for server-side admin operations
const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function verifyAdminUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  return user
}

export async function getAdminPrograms() {
  await verifyAdminUser()

  const { data, error } = await supabaseAdmin
    .from('programs')
    .select(`
      *,
      coach:users!coach_id(first_name, last_name, email),
      athlete:users!athlete_id(first_name, last_name, email),
      template:templates!template_id(title, type)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch programs: ${error.message}`)
  }

  return data
}

export async function getAdminUsers() {
  await verifyAdminUser()

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, role')
    .in('role', ['athlete', 'coach'])
    .order('first_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return data
}

export async function getAdminTemplates() {
  await verifyAdminUser()

  const { data, error } = await supabaseAdmin
    .from('templates')
    .select('id, title, type')
    .order('title', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }

  return data
}

export async function createAdminProgram(formData: {
  athleteId: string
  coachId: string
  templateId?: string
  title: string
  startDate: string
  endDate?: string
  notes?: string
}) {
  await verifyAdminUser()

  const { data, error } = await supabaseAdmin
    .from('programs')
    .insert({
      athlete_id: formData.athleteId,
      coach_id: formData.coachId,
      template_id: formData.templateId || null,
      title: formData.title,
      start_date: formData.startDate,
      end_date: formData.endDate || null,
      notes: formData.notes || null,
    })
    .select(`
      *,
      coach:users!coach_id(first_name, last_name, email),
      athlete:users!athlete_id(first_name, last_name, email),
      template:templates!template_id(title, type)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create program: ${error.message}`)
  }

  revalidatePath('/dashboard/programs')
  return data
}

export async function deleteAdminProgram(programId: string) {
  await verifyAdminUser()

  const { error } = await supabaseAdmin
    .from('programs')
    .delete()
    .eq('id', programId)

  if (error) {
    throw new Error(`Failed to delete program: ${error.message}`)
  }

  revalidatePath('/dashboard/programs')
}
