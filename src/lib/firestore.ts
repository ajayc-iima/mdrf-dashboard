import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, orderBy, limit, Timestamp, serverTimestamp,
  runTransaction, QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import { getWeekKey } from './utils'
import type {
  UserProfile, WorkLog, Task, SupportRequest, WorkloadCheckin,
  CaseStudy, CaseComment, CourseProgress, Note, NoteComment, NoteStatus,
  UserRole, Program, WorkCategory, SupportStatus, CaseStatus,
  WorkloadPressure, CaseType, LmsCourse,
} from '@/types'

// ─── Offline helpers ────────────────────────────────────────────────

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function dataFromCache(snapshot: { metadata: { fromCache: boolean } }): boolean {
  return snapshot.metadata.fromCache
}

// ─── Serialisation helpers ────────────────────────────────────────

function toDate(ts: any): Date {
  if (!ts) return new Date()
  if (ts instanceof Date) return ts
  if (ts.toDate) return ts.toDate()
  return new Date(ts)
}

function serializeDoc<T>(d: any): T {
  const data = d.data()
  const result: any = { id: d.id }
  for (const [key, value] of Object.entries(data)) {
    result[key] = value instanceof Timestamp ? toDate(value) : value
  }
  return result as T
}

// ─── Users ────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: { name: string; email: string }): Promise<void> {
  if (isOffline()) {
    const profileRef = doc(db, 'users', uid)
    await setDoc(profileRef, {
      name: data.name,
      email: data.email,
      district: 'All',
      constituencies: [],
      program: 'mdrf',
      role: null,
      status: 'pending',
      isActive: true,
      streak: 0,
      totalLogs: 0,
      badges: [],
      lastLogDate: null,
      createdAt: serverTimestamp(),
    })
    return
  }

  await runTransaction(db, async (tx) => {
    const bootstrapRef = doc(db, 'config', 'bootstrap')
    const bootstrapSnap = await tx.get(bootstrapRef)
    const isFirstUser = !bootstrapSnap.exists() || bootstrapSnap.get('adminAssigned') !== true

    const profileRef = doc(db, 'users', uid)
    const base = {
      name: data.name,
      email: data.email,
      district: 'All',
      constituencies: [],
      program: 'mdrf',
      isActive: true,
      streak: 0,
      totalLogs: 0,
      badges: [],
      lastLogDate: null,
      createdAt: serverTimestamp(),
    }

    if (isFirstUser) {
      tx.set(profileRef, { ...base, role: 'admin', status: 'approved' })
      tx.set(bootstrapRef, { adminAssigned: true, adminUid: uid }, { merge: true })
    } else {
      tx.set(profileRef, { ...base, role: null, status: 'pending' })
    }
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return serializeDoc<UserProfile>(snap)
}

export async function getPendingUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, 'users'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => serializeDoc<UserProfile>(d))
}

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => serializeDoc<UserProfile>(d))
}

export async function approveUser(
  uid: string,
  role: UserRole,
  program: Program,
  district: string,
  constituencies: string[] = [],
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role, status: 'approved', isActive: true, program, district, constituencies, lastLogDate: null,
  } as any)
}

export async function rejectUser(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected', isActive: false } as any)
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role } as any)
}

export async function setUserActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isActive } as any)
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as any)
}

/** All fellows, optionally scoped to a programme. */
export async function getFellows(program?: Program): Promise<UserProfile[]> {
  const constraints: QueryConstraint[] = [where('role', '==', 'fellow')]
  if (program) constraints.push(where('program', '==', program))
  const q = query(collection(db, 'users'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => serializeDoc<UserProfile>(d))
}

/** All approved users, optionally scoped to a programme. Used by admin. */
export async function getAllUsers(program?: Program): Promise<UserProfile[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
  ]
  if (program) constraints.push(where('program', '==', program))
  const snap = await getDocs(query(collection(db, 'users'), ...constraints))
  return snap.docs.map(d => serializeDoc<UserProfile>(d))
}

/** Per-district aggregate stats for admin dashboard. */
export async function getDistrictStats(program: Program): Promise<Record<string, { totalFellows: number; activeFellows: number; totalLogs: number }>> {
  const fellows = await getFellows(program)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
  const logs = await getWorkLogs({ program, startDate: sevenDaysAgo, limitCount: 10000 })

  const stats: Record<string, { totalFellows: number; activeFellows: number; totalLogs: number }> = {}
  for (const f of fellows) {
    if (!stats[f.district]) stats[f.district] = { totalFellows: 0, activeFellows: 0, totalLogs: 0 }
    stats[f.district].totalFellows++
    if (f.lastLogDate && f.lastLogDate.getTime() > sevenDaysAgo.getTime()) {
      stats[f.district].activeFellows++
    }
  }
  for (const l of logs) {
    if (!stats[l.district]) stats[l.district] = { totalFellows: 0, activeFellows: 0, totalLogs: 0 }
    stats[l.district].totalLogs++
  }
  return stats
}

// ─── Work logs (§3.1) ─────────────────────────────────────────────

export async function addWorkLog(log: Omit<WorkLog, 'id' | 'createdAt' | 'weekKey'>): Promise<string> {
  const weekKey = getWeekKey(log.date)
  const ref = await addDoc(collection(db, 'workLogs'), {
    ...log,
    weekKey,
    date: Timestamp.fromDate(log.date),
    createdAt: serverTimestamp(),
  })

  const userRef = doc(db, 'users', log.fellowId)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    const u = userSnap.data()
    const last = u.lastLogDate?.toDate()
    const today = new Date()
    const consecutive = last && (today.getTime() - last.getTime()) < 48 * 3600000
    await updateDoc(userRef, {
      totalLogs: (u.totalLogs || 0) + 1,
      streak: consecutive ? (u.streak || 0) + 1 : 1,
      lastLogDate: serverTimestamp(),
    } as any)
  }
  return ref.id
}

export async function getWorkLogs(filters: {
  fellowId?: string
  program?: Program
  district?: string
  constituency?: string
  category?: WorkCategory
  weekKey?: string
  startDate?: Date
  endDate?: Date
  limitCount?: number
}): Promise<WorkLog[]> {
  const c: QueryConstraint[] = []
  if (filters.fellowId) c.push(where('fellowId', '==', filters.fellowId))
  if (filters.program) c.push(where('program', '==', filters.program))
  if (filters.district) c.push(where('district', '==', filters.district))
  if (filters.constituency) c.push(where('constituency', '==', filters.constituency))
  if (filters.category) c.push(where('category', '==', filters.category))
  if (filters.weekKey) c.push(where('weekKey', '==', filters.weekKey))
  if (filters.startDate) c.push(where('date', '>=', Timestamp.fromDate(filters.startDate)))
  if (filters.endDate) c.push(where('date', '<=', Timestamp.fromDate(filters.endDate)))
  c.push(orderBy('date', 'desc'))
  if (filters.limitCount) c.push(limit(filters.limitCount))

  const snap = await getDocs(query(collection(db, 'workLogs'), ...c))
  return snap.docs.map(d => serializeDoc<WorkLog>(d))
}

// ─── Tasks ────────────────────────────────────────────────────────

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...task,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  await updateDoc(doc(db, 'tasks', taskId), { status, updatedAt: serverTimestamp() } as any)
}

export async function updateTaskDue(taskId: string, dueDate: Date | null): Promise<void> {
  await updateDoc(doc(db, 'tasks', taskId), {
    dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
    updatedAt: serverTimestamp(),
  } as any)
}

export async function getTasks(fellowId?: string): Promise<Task[]> {
  const c: QueryConstraint[] = []
  if (fellowId) c.push(where('fellowId', '==', fellowId))
  c.push(orderBy('updatedAt', 'desc'))
  const snap = await getDocs(query(collection(db, 'tasks'), ...c))
  return snap.docs.map(d => serializeDoc<Task>(d))
}

export async function getAllTasks(): Promise<Task[]> {
  const snap = await getDocs(query(collection(db, 'tasks'), orderBy('updatedAt', 'desc')))
  return snap.docs.map(d => serializeDoc<Task>(d))
}

// ─── Support requests (§3.2) ──────────────────────────────────────

export async function addSupportRequest(
  req: Omit<SupportRequest, 'id' | 'createdAt' | 'resolvedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'supportRequests'), {
    ...req, createdAt: serverTimestamp(), resolvedAt: null,
  })
  return ref.id
}

export async function updateSupportStatus(id: string, status: SupportStatus): Promise<void> {
  const data: any = { status }
  if (status === 'resolved') data.resolvedAt = serverTimestamp()
  await updateDoc(doc(db, 'supportRequests', id), data)
}

export async function getSupportRequests(filters?: {
  fellowId?: string
  program?: Program
  status?: SupportStatus
}): Promise<SupportRequest[]> {
  const c: QueryConstraint[] = []
  if (filters?.fellowId) c.push(where('fellowId', '==', filters.fellowId))
  if (filters?.program) c.push(where('program', '==', filters.program))
  if (filters?.status) c.push(where('status', '==', filters.status))
  c.push(orderBy('createdAt', 'desc'))
  const snap = await getDocs(query(collection(db, 'supportRequests'), ...c))
  return snap.docs.map(d => serializeDoc<SupportRequest>(d))
}

// ─── Workload self-declaration (§3.3) ─────────────────────────────

const workloadId = (fellowId: string, weekKey: string) => `${fellowId}_${weekKey}`

export async function setWorkloadCheckin(
  c: Omit<WorkloadCheckin, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const id = workloadId(c.fellowId, c.weekKey)
  const ref = doc(db, 'workloadCheckins', id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { pressure: c.pressure, note: c.note, updatedAt: serverTimestamp() } as any)
  } else {
    await setDoc(ref, { ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
}

export async function getWorkloadCheckin(fellowId: string, weekKey: string): Promise<WorkloadCheckin | null> {
  const snap = await getDoc(doc(db, 'workloadCheckins', workloadId(fellowId, weekKey)))
  return snap.exists() ? serializeDoc<WorkloadCheckin>(snap) : null
}

export async function getWorkloadForWeek(weekKey: string, program?: Program): Promise<WorkloadCheckin[]> {
  const c: QueryConstraint[] = [where('weekKey', '==', weekKey)]
  if (program) c.push(where('program', '==', program))
  const snap = await getDocs(query(collection(db, 'workloadCheckins'), ...c))
  return snap.docs.map(d => serializeDoc<WorkloadCheckin>(d))
}

// ─── LMS Courses (stored in config/lmsCourses for simpler security) ─

const LMS_DOC = doc(db, 'config', 'lmsCourses')

function lmsCourseId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export async function addLmsCourse(course: Omit<LmsCourse, 'id' | 'createdAt'>): Promise<string> {
  const id = lmsCourseId()
  const snap = await getDoc(LMS_DOC)
  const existing = snap.exists() ? snap.data().courses || [] : []
  await setDoc(LMS_DOC, {
    courses: [...existing, { ...course, id, createdAt: serverTimestamp() }],
  }, { merge: true })
  return id
}

export async function deleteLmsCourse(id: string): Promise<void> {
  const snap = await getDoc(LMS_DOC)
  if (!snap.exists()) return
  const courses = (snap.data().courses || []).filter((c: any) => c.id !== id)
  await setDoc(LMS_DOC, { courses }, { merge: true })
}

export async function getLmsCourses(program?: Program): Promise<LmsCourse[]> {
  const snap = await getDoc(LMS_DOC)
  if (!snap.exists()) return []
  const courses: LmsCourse[] = (snap.data().courses || []).map((c: any) => ({
    ...c,
    createdAt: c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt),
  }))
  let filtered = courses
  if (program) {
    filtered = courses.filter((c) => c.program === null || c.program === program)
  }
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getAllLmsCourses(): Promise<LmsCourse[]> {
  return getLmsCourses()
}

// ─── Case studies & discussion (§3.4) ─────────────────────────────

export async function addCaseStudy(
  cs: Omit<CaseStudy, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'caseStudies'), {
    ...cs, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCaseStudy(id: string, data: Partial<CaseStudy>): Promise<void> {
  await updateDoc(doc(db, 'caseStudies', id), { ...data, updatedAt: serverTimestamp() } as any)
}

export async function setCaseStatus(id: string, status: CaseStatus): Promise<void> {
  await updateDoc(doc(db, 'caseStudies', id), { status, updatedAt: serverTimestamp() } as any)
}

export async function getCaseStudies(filters?: {
  authorId?: string
  program?: Program
  status?: CaseStatus
  type?: CaseType
}): Promise<CaseStudy[]> {
  const c: QueryConstraint[] = []
  if (filters?.authorId) c.push(where('authorId', '==', filters.authorId))
  if (filters?.program) c.push(where('program', '==', filters.program))
  if (filters?.status) c.push(where('status', '==', filters.status))
  if (filters?.type) c.push(where('type', '==', filters.type))
  c.push(orderBy('createdAt', 'desc'))
  const snap = await getDocs(query(collection(db, 'caseStudies'), ...c))
  return snap.docs.map(d => serializeDoc<CaseStudy>(d))
}

export async function getCaseStudy(id: string): Promise<CaseStudy | null> {
  const snap = await getDoc(doc(db, 'caseStudies', id))
  return snap.exists() ? serializeDoc<CaseStudy>(snap) : null
}

export async function addCaseComment(
  comment: Omit<CaseComment, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'caseComments'), {
    ...comment, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getCaseComments(caseId: string): Promise<CaseComment[]> {
  const snap = await getDocs(query(
    collection(db, 'caseComments'),
    where('caseId', '==', caseId),
    orderBy('createdAt', 'asc'),
  ))
  return snap.docs.map(d => serializeDoc<CaseComment>(d))
}

// ─── Course progress (Certificate Programme) ──────────────────────

export async function getCourseProgress(fellowId: string): Promise<CourseProgress[]> {
  const snap = await getDocs(query(
    collection(db, 'courseProgress'),
    where('fellowId', '==', fellowId),
  ))
  return snap.docs.map(d => serializeDoc<CourseProgress>(d))
}

export async function setCourseProgress(
  fellowId: string,
  courseKey: string,
  status: CourseProgress['status'],
): Promise<void> {
  const id = `${fellowId}_${courseKey}`
  const ref = doc(db, 'courseProgress', id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { status, updatedAt: serverTimestamp() } as any)
  } else {
    await setDoc(ref, { fellowId, courseKey, status, updatedAt: serverTimestamp() })
  }
}

// ─── Aggregation / analytics ──────────────────────────────────────

export interface WeeklyCompliance {
  fellow: UserProfile
  weekKey: string
  logCount: number
  metTarget: boolean
  pressure?: WorkloadPressure
}

/** Per-fellow compliance for a given week. */
export async function getWeeklyCompliance(
  weekKey: string,
  program: Program,
  target: number,
): Promise<WeeklyCompliance[]> {
  const [fellows, logs, checkins] = await Promise.all([
    getFellows(program),
    getWorkLogs({ program, weekKey, limitCount: 5000 }),
    getWorkloadForWeek(weekKey, program),
  ])
  const pressureMap = new Map(checkins.map(c => [c.fellowId, c.pressure]))
  const logCounts = new Map<string, number>()
  for (const l of logs) {
    logCounts.set(l.fellowId, (logCounts.get(l.fellowId) || 0) + 1)
  }
  return fellows.map(fellow => ({
    fellow,
    weekKey,
    logCount: logCounts.get(fellow.id) || 0,
    metTarget: (logCounts.get(fellow.id) || 0) >= target,
    pressure: pressureMap.get(fellow.id),
  }))
}

export async function getCategoryStats(
  program: Program,
  startDate?: Date,
  endDate?: Date,
): Promise<Record<string, number>> {
  const logs = await getWorkLogs({ program, startDate, endDate, limitCount: 5000 })
  const cats: Record<string, number> = {}
  for (const l of logs) cats[l.category] = (cats[l.category] || 0) + 1
  return cats
}

export async function getDailyActivity(program: Program, days = 30): Promise<{ date: string; count: number }[]> {
  const startDate = new Date(Date.now() - days * 86400000)
  const logs = await getWorkLogs({ program, startDate, limitCount: 5000 })
  const map: Record<string, number> = {}
  for (const l of logs) {
    const k = l.date.toISOString().split('T')[0]
    map[k] = (map[k] || 0) + 1
  }
  const result: { date: string; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * 86400000)
    const k = d.toISOString().split('T')[0]
    result.push({ date: k, count: map[k] || 0 })
  }
  return result
}

/** Last N weeks of compliance rate (% meeting target) for trend. */
export async function getWeeklyTrend(program: Program, target: number, weeks = 8): Promise<{ weekKey: string; rate: number }[]> {
  const now = new Date()
  const result: { weekKey: string; rate: number }[] = []
  const fellows = await getFellows(program)
  const total = fellows.length || 1
  for (let i = weeks - 1; i >= 0; i--) {
    const ref = new Date(now.getTime() - i * 7 * 86400000)
    const wk = getWeekKey(ref)
    const logs = await getWorkLogs({ program, weekKey: wk, limitCount: 5000 })
    const counts = new Map<string, number>()
    for (const l of logs) counts.set(l.fellowId, (counts.get(l.fellowId) || 0) + 1)
    const met = fellows.filter(f => (counts.get(f.id) || 0) >= target).length
    result.push({ weekKey: wk, rate: Math.round((met / total) * 100) })
  }
  return result
}

// ─── Export helpers ───────────────────────────────────────────────

export async function exportWorkLogs(filters: {
  program: Program
  district?: string
  startDate?: Date
  endDate?: Date
  category?: WorkCategory
}) {
  const logs = await getWorkLogs({ ...filters, limitCount: 10000 })
  return logs.map(l => ({
    Fellow: l.fellowName,
    District: l.district,
    Constituency: l.constituency,
    Week: l.weekKey,
    Date: l.date.toISOString().split('T')[0],
    Category: l.category,
    Status: l.type,
    'Activity Description': l.activityDescription,
    'Output / Deliverable': l.outputDeliverable,
    Description: l.description,
  }))
}

export async function exportFellows(program: Program, fellows: UserProfile[]) {
  return fellows.map(f => ({
    Name: f.name,
    Email: f.email,
    Program: program.toUpperCase(),
    District: f.district,
    Constituencies: f.constituencies?.join(', ') || '',
    'Total Logs': f.totalLogs || 0,
    Streak: f.streak || 0,
    'Last Active': f.lastLogDate ? f.lastLogDate.toISOString().split('T')[0] : 'Never',
    Active: f.isActive ? 'Yes' : 'No',
  }))
}

// ─── Field Notes ────────────────────────────────────────────────

export async function createNote(
  note: Omit<Note, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'notes'), {
    ...note,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  await updateDoc(doc(db, 'notes', id), data as any)
}

export async function getNotes(filters?: {
  authorId?: string
  status?: NoteStatus
}): Promise<Note[]> {
  const c: QueryConstraint[] = []
  if (filters?.authorId) c.push(where('authorId', '==', filters.authorId))
  if (filters?.status) c.push(where('status', '==', filters.status))
  c.push(orderBy('createdAt', 'desc'))
  const snap = await getDocs(query(collection(db, 'notes'), ...c))
  return snap.docs.map(d => serializeDoc<Note>(d))
}

export async function addNoteComment(
  comment: Omit<NoteComment, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'noteComments'), {
    ...comment,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getNoteComments(noteId: string): Promise<NoteComment[]> {
  const snap = await getDocs(query(
    collection(db, 'noteComments'),
    where('noteId', '==', noteId),
    orderBy('createdAt', 'asc'),
  ))
  return snap.docs.map(d => serializeDoc<NoteComment>(d))
}
