import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { DashboardGuard } from '@/components/auth/dashboard-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardGuard>
      <AdminSidebar>
        {children}
      </AdminSidebar>
    </DashboardGuard>
  )
}
