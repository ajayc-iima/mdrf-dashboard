"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
export default function DataScientistLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={["data-scientist"]}>{children}</DashboardLayout>
}
