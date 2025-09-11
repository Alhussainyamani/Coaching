'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Settings, 
  Shield, 
  Database,
  Bell,
  Mail,
  Server,
  Lock,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  Save,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface PlatformSettings {
  general: {
    platformName: string
    description: string
    supportEmail: string
    timezone: string
    language: string
    maintenanceMode: boolean
  }
  security: {
    passwordMinLength: number
    sessionTimeout: number
    twoFactorRequired: boolean
    allowSelfRegistration: boolean
    emailVerificationRequired: boolean
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    messageNotifications: boolean
    systemAlerts: boolean
  }
  features: {
    realTimeChat: boolean
    videoUploads: boolean
    programTemplates: boolean
    analyticsReports: boolean
    contentModeration: boolean
  }
  limits: {
    maxFileSize: number
    maxVideoLength: number
    maxUsersPerCoach: number
    maxProgramsPerUser: number
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platformName: 'Coaching Platform',
      description: 'Professional coaching and training platform',
      supportEmail: 'support@coaching.platform',
      timezone: 'UTC',
      language: 'ar',
      maintenanceMode: false,
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 24,
      twoFactorRequired: false,
      allowSelfRegistration: true,
      emailVerificationRequired: true,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      messageNotifications: true,
      systemAlerts: true,
    },
    features: {
      realTimeChat: true,
      videoUploads: true,
      programTemplates: true,
      analyticsReports: true,
      contentModeration: true,
    },
    limits: {
      maxFileSize: 50, // MB
      maxVideoLength: 300, // seconds
      maxUsersPerCoach: 50,
      maxProgramsPerUser: 10,
    },
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // In a real implementation, this would save to a settings table
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = () => {
    setSettings({
      general: {
        platformName: 'Coaching Platform',
        description: 'Professional coaching and training platform',
        supportEmail: 'support@coaching.platform',
        timezone: 'UTC',
        language: 'ar',
        maintenanceMode: false,
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 24,
        twoFactorRequired: false,
        allowSelfRegistration: true,
        emailVerificationRequired: true,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        messageNotifications: true,
        systemAlerts: true,
      },
      features: {
        realTimeChat: true,
        videoUploads: true,
        programTemplates: true,
        analyticsReports: true,
        contentModeration: true,
      },
      limits: {
        maxFileSize: 50,
        maxVideoLength: 300,
        maxUsersPerCoach: 50,
        maxProgramsPerUser: 10,
      },
    })
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center">
            <Server className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Limits
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic platform configuration and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.general.platformName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, platformName: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, supportEmail: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Platform Description</Label>
                <Textarea
                  id="description"
                  value={settings.general.description}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select 
                    value={settings.general.timezone}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      general: { ...settings.general, timezone: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select 
                    value={settings.general.language}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      general: { ...settings.general, language: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">
                    Temporarily disable platform access for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    general: { ...settings.general, maintenanceMode: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Authentication and access control configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="passwordLength">Minimum Password Length</Label>
                  <Input
                    id="passwordLength"
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication Required</Label>
                    <p className="text-sm text-gray-500">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      security: { ...settings.security, twoFactorRequired: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow Self Registration</Label>
                    <p className="text-sm text-gray-500">
                      Allow users to register without invitation
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.allowSelfRegistration}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      security: { ...settings.security, allowSelfRegistration: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Verification Required</Label>
                    <p className="text-sm text-gray-500">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.emailVerificationRequired}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      security: { ...settings.security, emailVerificationRequired: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system-wide notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send email notifications for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailNotifications: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Enable mobile push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, pushNotifications: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Message Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Notify users of new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.messageNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, messageNotifications: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Critical system alerts and warnings
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, systemAlerts: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Real-time Chat</Label>
                    <p className="text-sm text-gray-500">
                      Enable real-time messaging between users
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.realTimeChat}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      features: { ...settings.features, realTimeChat: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Video Uploads</Label>
                    <p className="text-sm text-gray-500">
                      Allow users to upload video content
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.videoUploads}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      features: { ...settings.features, videoUploads: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Program Templates</Label>
                    <p className="text-sm text-gray-500">
                      Enable coach program template system
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.programTemplates}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      features: { ...settings.features, programTemplates: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Analytics Reports</Label>
                    <p className="text-sm text-gray-500">
                      Enable advanced analytics and reporting
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.analyticsReports}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      features: { ...settings.features, analyticsReports: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Content Moderation</Label>
                    <p className="text-sm text-gray-500">
                      Enable automated content moderation
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.contentModeration}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      features: { ...settings.features, contentModeration: checked }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Settings */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Platform Limits</CardTitle>
              <CardDescription>
                Configure usage limits and quotas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="500"
                    value={settings.limits.maxFileSize}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxFileSize: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxVideoLength">Max Video Length (seconds)</Label>
                  <Input
                    id="maxVideoLength"
                    type="number"
                    min="30"
                    max="1800"
                    value={settings.limits.maxVideoLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxVideoLength: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxUsersPerCoach">Max Athletes per Coach</Label>
                  <Input
                    id="maxUsersPerCoach"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.limits.maxUsersPerCoach}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxUsersPerCoach: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxProgramsPerUser">Max Programs per User</Label>
                  <Input
                    id="maxProgramsPerUser"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.limits.maxProgramsPerUser}
                    onChange={(e) => setSettings({
                      ...settings,
                      limits: { ...settings.limits, maxProgramsPerUser: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


