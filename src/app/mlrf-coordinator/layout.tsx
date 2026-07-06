"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
export default function MLRFCoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={["mlrf-coordinator"]}>{children}</DashboardLayout>
}