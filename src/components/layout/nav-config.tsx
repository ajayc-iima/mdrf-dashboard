import {
  LayoutDashboard, ClipboardList, LifeBuoy, Users, BarChart3,
  Bell, BookOpen, Map, GraduationCap, AlertTriangle, Shield, ExternalLink,
  FileText,
} from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  external?: boolean
  comingSoon?: boolean
}

const I = {
  home: <LayoutDashboard className="h-4 w-4" />,
  history: <ClipboardList className="h-4 w-4" />,
  help: <LifeBuoy className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  cases: <BookOpen className="h-4 w-4" />,
  alerts: <Bell className="h-4 w-4" />,
  map: <Map className="h-4 w-4" />,
  oversight: <BarChart3 className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  grad: <GraduationCap className="h-4 w-4" />,
  warn: <AlertTriangle className="h-4 w-4" />,
  lms: <ExternalLink className="h-4 w-4" />,
  reports: <FileText className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
}

const Mi = {
  home: <LayoutDashboard className="h-5 w-5" />,
  history: <ClipboardList className="h-5 w-5" />,
  help: <LifeBuoy className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  cases: <BookOpen className="h-5 w-5" />,
  alerts: <Bell className="h-5 w-5" />,
  map: <Map className="h-5 w-5" />,
  oversight: <BarChart3 className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  grad: <GraduationCap className="h-5 w-5" />,
  warn: <AlertTriangle className="h-5 w-5" />,
  lms: <ExternalLink className="h-5 w-5" />,
  reports: <FileText className="h-5 w-5" />,
  notifications: <Bell className="h-5 w-5" />,
}

export const NAV: Record<UserRole, NavItem[]> = {
  fellow: [
    { label: 'Home', href: '/fellow', icon: I.home },
    { label: 'History', href: '/fellow/history', icon: I.history },
    { label: 'Case Studies', href: '/fellow/cases', icon: I.cases },
    { label: 'Field Notes', href: '/fellow/notes', icon: I.history },
    { label: 'Get Help', href: '/fellow/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
  ],
  'data-scientist': [
    { label: 'Home', href: '/data-scientist', icon: I.home },
    { label: 'Analysis', href: '/data-scientist/analysis', icon: I.cases },
    { label: 'History', href: '/data-scientist/history', icon: I.history },
    { label: 'Case Studies', href: '/data-scientist/cases', icon: I.cases },
    { label: 'Fellows', href: '/data-scientist/fellows', icon: I.users },
    { label: 'Notifications', href: '/data-scientist/notifications', icon: I.notifications },
    { label: 'Get Help', href: '/data-scientist/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
  ],
  'srf': [
    { label: 'Home', href: '/srf', icon: I.home },
    { label: 'Research', href: '/srf/research', icon: I.cases },
    { label: 'History', href: '/srf/history', icon: I.history },
    { label: 'Case Studies', href: '/srf/cases', icon: I.cases },
    { label: 'Fellows', href: '/srf/fellows', icon: I.users },
    { label: 'Notifications', href: '/srf/notifications', icon: I.notifications },
    { label: 'Get Help', href: '/srf/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
  ],
  'mdrf-coordinator': [
    { label: 'Overview', href: '/mdrf-coordinator', icon: I.map },
    { label: 'Alerts', href: '/mdrf-coordinator/alerts', icon: I.alerts },
    { label: 'Case Studies', href: '/mdrf-coordinator/cases', icon: I.cases },
    { label: 'Reports', href: '/mdrf-coordinator/reports', icon: I.reports },
    { label: 'Support', href: '/mdrf-coordinator/support', icon: I.help },
    { label: 'LMS Progress', href: '/mdrf-coordinator/lms', icon: I.lms },
  ],
  'mlrf-coordinator': [
    { label: 'Overview', href: '/mlrf-coordinator', icon: I.map },
    { label: 'Alerts', href: '/mlrf-coordinator/alerts', icon: I.alerts },
    { label: 'Case Studies', href: '/mlrf-coordinator/cases', icon: I.cases },
    { label: 'Reports', href: '/mlrf-coordinator/reports', icon: I.reports },
    { label: 'Support', href: '/mlrf-coordinator/support', icon: I.help },
    { label: 'LMS Progress', href: '/mlrf-coordinator/lms', icon: I.lms },
  ],
  director: [
    { label: 'Overview', href: '/director', icon: I.oversight },
    { label: 'Compliance', href: '/director/compliance', icon: I.warn },
    { label: 'Case Studies', href: '/director/cases', icon: I.cases },
    { label: 'Support', href: '/director/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
  ],
  admin: [
    { label: 'Overview', href: '/admin', icon: I.home },
    { label: 'Users', href: '/admin/users', icon: I.users },
    { label: 'ISB LMS', href: '/admin/lms', icon: I.lms },
  ],
}

export const NAV_MOBILE: Record<UserRole, NavItem[]> = {
  fellow: [
    { label: 'Home', href: '/fellow', icon: Mi.home },
    { label: 'History', href: '/fellow/history', icon: Mi.history },
    { label: 'Cases', href: '/fellow/cases', icon: Mi.cases },
    { label: 'Notes', href: '/fellow/notes', icon: Mi.history },
    { label: 'Help', href: '/fellow/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
  ],
  'data-scientist': [
    { label: 'Home', href: '/data-scientist', icon: Mi.home },
    { label: 'Analysis', href: '/data-scientist/analysis', icon: Mi.cases },
    { label: 'Cases', href: '/data-scientist/cases', icon: Mi.cases },
    { label: 'Fellows', href: '/data-scientist/fellows', icon: Mi.users },
    { label: 'Alerts', href: '/data-scientist/notifications', icon: Mi.notifications },
    { label: 'Help', href: '/data-scientist/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
  ],
  'srf': [
    { label: 'Home', href: '/srf', icon: Mi.home },
    { label: 'Research', href: '/srf/research', icon: Mi.cases },
    { label: 'Cases', href: '/srf/cases', icon: Mi.cases },
    { label: 'Fellows', href: '/srf/fellows', icon: Mi.users },
    { label: 'Alerts', href: '/srf/notifications', icon: Mi.notifications },
    { label: 'Help', href: '/srf/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
  ],
  'mdrf-coordinator': [
    { label: 'Home', href: '/mdrf-coordinator', icon: Mi.map },
    { label: 'Alerts', href: '/mdrf-coordinator/alerts', icon: Mi.alerts },
    { label: 'Cases', href: '/mdrf-coordinator/cases', icon: Mi.cases },
    { label: 'Reports', href: '/mdrf-coordinator/reports', icon: Mi.reports },
    { label: 'Help', href: '/mdrf-coordinator/support', icon: Mi.help },
    { label: 'LMS', href: '/mdrf-coordinator/lms', icon: Mi.lms },
  ],
  'mlrf-coordinator': [
    { label: 'Home', href: '/mlrf-coordinator', icon: Mi.map },
    { label: 'Alerts', href: '/mlrf-coordinator/alerts', icon: Mi.alerts },
    { label: 'Cases', href: '/mlrf-coordinator/cases', icon: Mi.cases },
    { label: 'Reports', href: '/mlrf-coordinator/reports', icon: Mi.reports },
    { label: 'Help', href: '/mlrf-coordinator/support', icon: Mi.help },
    { label: 'LMS', href: '/mlrf-coordinator/lms', icon: Mi.lms },
  ],
  director: [
    { label: 'Home', href: '/director', icon: Mi.oversight },
    { label: 'Comply', href: '/director/compliance', icon: Mi.warn },
    { label: 'Cases', href: '/director/cases', icon: Mi.cases },
    { label: 'Help', href: '/director/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
  ],
  admin: [
    { label: 'Home', href: '/admin', icon: Mi.home },
    { label: 'Users', href: '/admin/users', icon: Mi.users },
    { label: 'LMS', href: '/admin/lms', icon: Mi.lms },
  ],
}

export function isActive(pathname: string, href: string): boolean {
  if (href === pathname) return true
  return href !== '/' && pathname.startsWith(href + '/')
}
