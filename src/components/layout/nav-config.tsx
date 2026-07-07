import {
  LayoutDashboard, ClipboardList, LifeBuoy, Users, BarChart3,
  Bell, BookOpen, Map, GraduationCap, AlertTriangle, Shield, ExternalLink,
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
}

export const NAV: Record<UserRole, NavItem[]> = {
  fellow: [
    { label: 'Home', href: '/fellow', icon: I.home },
    { label: 'History', href: '/fellow/history', icon: I.history },
    { label: 'Case Studies', href: '/fellow/cases', icon: I.cases },
    { label: 'Get Help', href: '/fellow/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
  ],
  'mdrf-coordinator': [
    { label: 'Overview', href: '/mdrf-coordinator', icon: I.map },
    { label: 'Alerts', href: '/mdrf-coordinator/alerts', icon: I.alerts },
    { label: 'Case Studies', href: '/mdrf-coordinator/cases', icon: I.cases },
    { label: 'Support', href: '/mdrf-coordinator/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
  ],
  'mlrf-coordinator': [
    { label: 'Overview', href: '/mlrf-coordinator', icon: I.map },
    { label: 'Alerts', href: '/mlrf-coordinator/alerts', icon: I.alerts },
    { label: 'Case Studies', href: '/mlrf-coordinator/cases', icon: I.cases },
    { label: 'Support', href: '/mlrf-coordinator/support', icon: I.help },
    { label: 'ISB LMS', href: '/fellow/lms', icon: I.lms },
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
    { label: 'Help', href: '/fellow/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
  ],
  'mdrf-coordinator': [
    { label: 'Home', href: '/mdrf-coordinator', icon: Mi.map },
    { label: 'Alerts', href: '/mdrf-coordinator/alerts', icon: Mi.alerts },
    { label: 'Cases', href: '/mdrf-coordinator/cases', icon: Mi.cases },
    { label: 'Help', href: '/mdrf-coordinator/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
  ],
  'mlrf-coordinator': [
    { label: 'Home', href: '/mlrf-coordinator', icon: Mi.map },
    { label: 'Alerts', href: '/mlrf-coordinator/alerts', icon: Mi.alerts },
    { label: 'Cases', href: '/mlrf-coordinator/cases', icon: Mi.cases },
    { label: 'Help', href: '/mlrf-coordinator/support', icon: Mi.help },
    { label: 'LMS', href: '/fellow/lms', icon: Mi.lms },
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
