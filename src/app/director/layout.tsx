"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={["director"]}>{children}</DashboardLayout>
}
