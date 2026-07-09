// ─── Core domain types — MDRF Connect / MLRF Connect ──────────────

export type UserRole = 'admin' | 'director' | 'mdrf-coordinator' | 'mlrf-coordinator' | 'fellow' | 'data-scientist' | 'srf'
export type Program = 'mdrf' | 'mlrf'
/** @deprecated Use Program directly. Kept for backward compat during migration. */
export type DashboardType = Program
export type LogType = 'completed' | 'ongoing' | 'planned'        // §3.1 Status
export type WorkCategory =
  | 'research'    // Research-based support (data/policy analysis)
  | 'fieldwork'   // Fieldwork & data collection
  | 'report'      // Report writing
  | 'admin'       // Administrative & managerial support
  | 'capacity'    // Capacity-building activities
  | 'other'       // Miscellaneous
export type TaskStatus = 'ongoing' | 'completed' | 'stuck'
export type SupportCategory =
  | 'knowledge'   // Knowledge support
  | 'data'        // Data provisioning
  | 'analysis'    // Statistical & analytical support
  | 'technical'   // Technical issues
  | 'logistics'   // Logistical support
  | 'capacity'    // Capacity-building needs
export type Urgency = 'low' | 'medium' | 'high'
export type SupportStatus = 'open' | 'in_progress' | 'resolved'
export type AccountStatus = 'pending' | 'approved' | 'rejected'
/** §3.3 Workload self-declaration. */
export type WorkloadPressure = 'under' | 'optimal' | 'over'
export type CaseType = 'case_study' | 'policy_brief' | 'field_breakthrough'
export type CaseStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'published'
export type CourseStatus = 'not_started' | 'in_progress' | 'done'

/** Roles an admin may assign to a user. */
export const ASSIGNABLE_ROLES: UserRole[] = [
  'fellow', 'data-scientist', 'srf', 'mdrf-coordinator', 'mlrf-coordinator', 'director',
]

/** A user is a "fellow" only when their role is exactly this. */
export const FELLOW_ROLES: UserRole[] = ['fellow']
export const IS_FELLOW = (role: UserRole | null | undefined): boolean => role === 'fellow'

/** Everyone except fellows (coordinators, directors, DS, SRF, admins). */
export const NON_FELLOW_ROLES: UserRole[] = [
  'admin', 'director', 'mdrf-coordinator', 'mlrf-coordinator', 'data-scientist', 'srf',
]

/** Roles that receive support/notification alerts. */
export const NOTIFIABLE_ROLES: UserRole[] = ['data-scientist', 'srf']

/** All roles in the system, for completeness checks. */
export const ALL_ROLES: UserRole[] = [
  'admin', 'director', 'mdrf-coordinator', 'mlrf-coordinator', 'fellow', 'data-scientist', 'srf',
]

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole | null
  status: AccountStatus
  program: Program
  district: string
  constituencies: string[]
  isActive: boolean
  createdAt: Date
  lastLogDate: Date | null
  streak: number
  totalLogs: number
  badges: string[]
  /** Only for data-scientist and srf roles */
  reportsTo?: string
}

export type RequestType = 'data_analysis' | 'policy_drafting' | 'subject_matter_expert' | 'administrative'

export interface WorkLog {
  id: string
  fellowId: string
  fellowName: string
  district: string
  constituency: string
  program: Program
  date: Date
  weekKey: string                 // ISO week "2026-W27"
  category: WorkCategory
  activityDescription: string
  outputDeliverable: string
  description: string             // kept for backward compat; concatenation of activity+output
  type: LogType
  dueDate?: Date
  createdAt: Date
}

export interface Task {
  id: string
  fellowId: string
  fellowName: string
  district: string
  title: string
  status: TaskStatus
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SupportRequest {
  id: string
  fellowId: string
  fellowName: string
  district: string
  program: Program
  category: SupportCategory
  requestType?: RequestType
  description: string
  urgency: Urgency
  status: SupportStatus
  createdAt: Date
  resolvedAt: Date | null
}

/** §3.3 Weekly workload self-declaration. One per fellow per week. */
export interface WorkloadCheckin {
  id: string                      // `${fellowId}_${weekKey}`
  fellowId: string
  fellowName: string
  district: string
  program: Program
  weekKey: string
  pressure: WorkloadPressure
  note: string
  createdAt: Date
  updatedAt: Date
}

/** §3.4 Case study / policy brief / field breakthrough. */
export interface CaseStudy {
  id: string
  authorId: string
  authorName: string
  district: string
  program: Program
  type: CaseType
  title: string
  summary: string
  content: string
  attachmentName: string | null   // uploaded file name (metadata only)
  onedriveLink?: string          // ISB OneDrive link for the document
  status: CaseStatus
  reviewedBy?: string            // SRF or coordinator who reviewed
  reviewedByName?: string
  reviewedAt?: Date
  reviewComments?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CaseComment {
  id: string
  caseId: string
  authorId: string
  authorName: string
  authorRole: UserRole
  content: string
  action: 'discuss' | 'publish' | 'analyze'  // suggested next step
  createdAt: Date
}

/** Certificate Programme in Public Policy course progress. */
export interface CourseProgress {
  id: string                      // `${fellowId}_${courseKey}`
  fellowId: string
  courseKey: string
  status: CourseStatus
  updatedAt: Date
}

export interface LmsCourse {
  id: string
  title: string
  url: string
  description: string
  program: Program | null          // null = visible to all programs
  createdAt: Date
}

export interface Note {           // lightweight field notes (kept for continuity)
  id: string
  authorId: string
  authorName: string
  program: Program
  title: string
  content: string
  fileUrl: string | null
  status: NoteStatus
  tags: string[]
  createdAt: Date
}

export type NoteStatus = 'draft' | 'published'

export interface NoteComment {
  id: string
  noteId: string
  authorId: string
  authorName: string
  content: string
  createdAt: Date
}

// ─── Reference data ────────────────────────────────────────────────

export const DISTRICTS = [
  'East Garo Hills', 'North Garo Hills', 'South Garo Hills',
  'West Garo Hills', 'South West Garo Hills',
  'East Khasi Hills', 'West Khasi Hills', 'South West Khasi Hills',
  'Eastern West Khasi Hills', 'Ri Bhoi',
  'East Jaintia Hills', 'West Jaintia Hills',
] as const

export const CONSTITUENCIES = [
  'Nartiang', 'Jowai', 'Raliang', 'Mowkaiaw', 'Sutnga Saipung', 'Khliehriat', 'Amlarem',
  'Mawhati', 'Nongpoh', 'Jirang', 'Umsning', 'Umroi', 'Mawrengkneng', 'Pynthorumkhrah',
  'Mawlai', 'East Shillong', 'North Shillong', 'West Shillong', 'South Shillong', 'Mylliem',
  'Nongthymmai', 'Nongkrem', 'Sohiong', 'Mawphlang', 'Mawsynram', 'Shella', 'Pynursla',
  'Sohra', 'Mawkynrew', 'Mairang', 'Mawthadraishan', 'Nongstoin', 'Rambrai-Jyrngam',
  'Mawshynrut', 'Ranikor', 'Mawkyrwat', 'Kharkutta', 'Mendipathar', 'Resubelpara',
  'Bajengdoba', 'Songsak', 'Rongjeng', 'Williamnagar', 'Raksamgre', 'Tikrikilla', 'Phulbari',
  'Rajabala', 'Selsella', 'Dadenggre', 'North Tura', 'South Tura', 'Rangsakona', 'Ampati',
  'Mahendraganj', 'Salmanpara', 'Gambegre', 'Dalu', 'Rongara Siju', 'Chokpot', 'Baghmara',
] as const

export const WORK_CATEGORIES: { value: WorkCategory; label: string; emoji: string }[] = [
  { value: 'research', label: 'Research Support', emoji: '🔬' },
  { value: 'fieldwork', label: 'Fieldwork & Data', emoji: '🚶' },
  { value: 'report', label: 'Report Writing', emoji: '📝' },
  { value: 'admin', label: 'Admin & Managerial', emoji: '🧩' },
  { value: 'capacity', label: 'Capacity-building', emoji: '📚' },
  { value: 'other', label: 'Miscellaneous', emoji: '📌' },
]

export const LOG_TYPES: { value: LogType; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'planned', label: 'Planned' },
]

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string; emoji: string }[] = [
  { value: 'knowledge', label: 'Knowledge Support', emoji: '🧠' },
  { value: 'data', label: 'Data Provisioning', emoji: '📦' },
  { value: 'analysis', label: 'Statistical & Analytical', emoji: '📐' },
  { value: 'technical', label: 'Technical Issue', emoji: '🔧' },
  { value: 'logistics', label: 'Logistical Support', emoji: '🚚' },
  { value: 'capacity', label: 'Capacity-building', emoji: '🎓' },
]

export const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'policy_drafting', label: 'Policy Drafting' },
  { value: 'subject_matter_expert', label: 'Subject Matter Expert' },
  { value: 'administrative', label: 'Administrative' },
]

export const CASE_TYPES: { value: CaseType; label: string; emoji: string }[] = [
  { value: 'case_study', label: 'Case Study', emoji: '📄' },
  { value: 'policy_brief', label: 'Policy Brief', emoji: '📋' },
  { value: 'field_breakthrough', label: 'Field Breakthrough', emoji: '✨' },
]

export const WORKLOAD_LABELS: Record<WorkloadPressure, string> = {
  under: 'Under-worked',
  optimal: 'Optimal',
  over: 'Over-worked',
}
