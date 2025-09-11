'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Filter, 
  MoreHorizontal, 
  Plus,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  getAdminPrograms, 
  getAdminUsers, 
  getAdminTemplates, 
  createAdminProgram, 
  deleteAdminProgram 
} from '@/app/actions/admin-programs'
import type { Tables } from '@/types/database.types'

type Program = Tables<'programs'> & {
  coach: { first_name: string; last_name: string; email: string } | null
  athlete: { first_name: string; last_name: string; email: string } | null
  template: { title: string; type: string } | null
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [users, setUsers] = useState<{ id: string; first_name: string | null; last_name: string | null; email: string; role: string }[]>([])
  const [templates, setTemplates] = useState<{ id: string; title: string; type: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    athleteId: '',
    coachId: '',
    templateId: '',
    title: '',
    startDate: '',
    endDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchPrograms()
    fetchUsers()
    fetchTemplates()
  }, [])

  const fetchPrograms = async () => {
    try {
      const data = await getAdminPrograms()
      setPrograms((data || []) as Program[])
    } catch (error) {
      toast.error('Failed to fetch programs')
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers()
      setUsers(data || [])
    } catch (error) {
      toast.error('Failed to fetch users')
      console.error('Error fetching users:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const data = await getAdminTemplates()
      setTemplates(data || [])
    } catch (error) {
      toast.error('Failed to fetch templates')
      console.error('Error fetching templates:', error)
    }
  }

  const handleCreateProgram = async () => {
    if (!formData.athleteId || !formData.coachId || !formData.title || !formData.startDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const data = await createAdminProgram(formData)
      setPrograms([data as Program, ...programs])
      toast.success('Program created successfully')
      setCreateDialogOpen(false)
      setFormData({
        athleteId: '',
        coachId: '',
        templateId: '',
        title: '',
        startDate: '',
        endDate: '',
        notes: ''
      })
    } catch (error) {
      toast.error('Failed to create program')
      console.error('Error creating program:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProgram = async (programId: string) => {
    try {
      await deleteAdminProgram(programId)
      setPrograms(programs.filter(program => program.id !== programId))
      toast.success('Program deleted successfully')
    } catch (error) {
      toast.error('Failed to delete program')
      console.error('Error deleting program:', error)
    }
  }

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = 
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.athlete?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.athlete?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.coach?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.coach?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || program.template?.type === typeFilter

    return matchesSearch && matchesType
  })

  const getStatusBadge = (program: Program) => {
    const now = new Date()
    const startDate = new Date(program.start_date)
    const endDate = program.end_date ? new Date(program.end_date) : null

    if (now < startDate) {
      return <Badge variant="outline" className="text-blue-600 border-blue-200">Upcoming</Badge>
    } else if (endDate && now > endDate) {
      return <Badge variant="outline" className="text-gray-600 border-gray-200">Completed</Badge>
    } else {
      return <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
    }
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
            Programs
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage training programs and assignments
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>
                Create a new training program for an athlete
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Program Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Strength Building Program"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coach">Coach *</Label>
                  <Select
                    value={formData.coachId}
                    onValueChange={(value) => setFormData({ ...formData, coachId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'coach').map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.first_name && coach.last_name 
                            ? `${coach.first_name} ${coach.last_name}`
                            : coach.email
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="athlete">Athlete *</Label>
                  <Select
                    value={formData.athleteId}
                    onValueChange={(value) => setFormData({ ...formData, athleteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'athlete').map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.first_name && athlete.last_name 
                            ? `${athlete.first_name} ${athlete.last_name}`
                            : athlete.email
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the program..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProgram}
                  disabled={creating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {creating ? 'Creating...' : 'Create Program'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programs Management */}
      <Card>
        <CardHeader>
          <CardTitle>Program Management</CardTitle>
          <CardDescription>
            View and manage all training programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search programs by title, athlete, or coach..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="rehab">Rehabilitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Programs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No programs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {program.title}
                          </div>
                          {program.template && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Based on: {program.template.title}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {program.athlete?.first_name && program.athlete?.last_name
                              ? `${program.athlete.first_name} ${program.athlete.last_name}`
                              : 'Unknown Athlete'
                            }
                          </div>
                          <div className="text-gray-500">
                            {program.athlete?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {program.coach?.first_name && program.coach?.last_name
                              ? `${program.coach.first_name} ${program.coach.last_name}`
                              : 'Unknown Coach'
                            }
                          </div>
                          <div className="text-gray-500">
                            {program.coach?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.template && (
                          <Badge variant="secondary" className="capitalize">
                            {program.template.type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(program.start_date).toLocaleDateString()}</span>
                        </div>
                        {program.end_date && (
                          <div className="text-gray-500 text-xs">
                            to {new Date(program.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(program)}
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
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Program
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <User className="mr-2 h-4 w-4" />
                              View Progress
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProgram(program.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Program
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
              Showing {filteredPrograms.length} of {programs.length} programs
            </span>
            <div className="flex items-center space-x-4">
              <span>{programs.filter(p => {
                const now = new Date()
                const startDate = new Date(p.start_date)
                const endDate = p.end_date ? new Date(p.end_date) : null
                return now >= startDate && (!endDate || now <= endDate)
              }).length} Active</span>
              <span>{programs.filter(p => {
                const now = new Date()
                const startDate = new Date(p.start_date)
                return now < startDate
              }).length} Upcoming</span>
              <span>{programs.filter(p => {
                const now = new Date()
                const endDate = p.end_date ? new Date(p.end_date) : null
                return endDate && now > endDate
              }).length} Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
