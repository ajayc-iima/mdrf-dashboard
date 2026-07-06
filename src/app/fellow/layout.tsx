"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
export default function FellowLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={["fellow"]}>{children}</DashboardLayout>
}
