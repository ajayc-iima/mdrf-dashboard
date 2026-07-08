"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
export default function SrfLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={["srf"]}>{children}</DashboardLayout>
}
