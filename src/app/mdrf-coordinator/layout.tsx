"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
export default function MDRFCoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={["mdrf-coordinator"]}>{children}</DashboardLayout>
}