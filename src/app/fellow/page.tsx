"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useFellowData, useWeekLogCount, useCourseProgress } from "@/hooks/useQueries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { DeadlineBanner } from "@/components/shared/deadline-banner"

import { WeeklyProgress } from "@/components/shared/weekly-progress"
import { CourseProgress } from "@/components/shared/course-progress"
import { WorkloadMeter } from "@/components/shared/workload-meter"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { addWorkLog, addTask, updateTaskStatus } from "@/lib/firestore"
import { formatDate } from "@/lib/utils"
import { WORK_CATEGORIES, LOG_TYPES, type WorkCategory, type LogType, type TaskStatus } from "@/types"
import { programAppName } from "@/lib/constants"
import { getCurrentWeekKey } from "@/lib/utils"
import {
  Send, MapPin, Building2, ClipboardList, Flame, ListTodo,
  AlertTriangle, CheckCircle2, Circle, HelpCircle, GraduationCap, Square,
} from "lucide-react"

export default function FellowDashboard() {
  const { profile } = useAuth()
  const router = useRouter()
  const { logs, tasks, loading } = useFellowData(profile?.id)
  const weekCount = useWeekLogCount(profile?.id)
  const courseProg = useCourseProgress(profile?.id)

  // Form state
  const [logCategory, setLogCategory] = useState<WorkCategory>("fieldwork")
  const [logType, setLogType] = useState<LogType>("completed")
  const [logActivity, setLogActivity] = useState("")
  const [logOutput, setLogOutput] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState("")
  const [listeningActivity, setListeningActivity] = useState(false)
  const [listeningOutput, setListeningOutput] = useState(false)
  const [fileError, setFileError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null

  function startVoice(target: 'activity' | 'output') {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false
    if (target === 'activity') {
      setListeningActivity(true)
      recognition.onresult = (e: any) => {
        setLogActivity(prev => prev + ' ' + e.results[0][0].transcript)
        setListeningActivity(false)
      }
      recognition.onerror = () => setListeningActivity(false)
      recognition.onend = () => setListeningActivity(false)
    } else {
      setListeningOutput(true)
      recognition.onresult = (e: any) => {
        setLogOutput(prev => prev + ' ' + e.results[0][0].transcript)
        setListeningOutput(false)
      }
      recognition.onerror = () => setListeningOutput(false)
      recognition.onend = () => setListeningOutput(false)
    }
    recognition.start()
  }

  if (loading || !profile) {
    return (
      <div className="space-y-6 stagger-children">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />
        ))}
      </div>
    )
  }

  const appName = programAppName(profile.program)
  const activeTasks = tasks.filter((t) => t.status === "ongoing")
  const stuckTasks = tasks.filter((t) => t.status === "stuck")
  const isMLRF = profile.program === "mlrf"
  const locationIcon = isMLRF ? <MapPin className="h-4 w-4 text-[hsl(var(--text-4))]" /> : <Building2 className="h-4 w-4 text-[hsl(var(--text-4))]" />
  const locationLabel = isMLRF
    ? (profile.constituencies?.join(", ") || "Not assigned")
    : profile.district

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || (!logActivity.trim() && !logOutput.trim())) return
    if (logActivity.trim().length < 10) return
    setSubmitting(true)
    const act = logActivity.trim()
    const out = logOutput.trim()
    await addWorkLog({
      fellowId: profile.id,
      fellowName: profile.name,
      district: profile.district,
      constituency: isMLRF ? (profile.constituencies?.[0] || "") : profile.district,
      program: profile.program,
      date: new Date(),
      category: logCategory,
      activityDescription: act,
      outputDeliverable: out,
      description: `${act}${out ? ` — ${out}` : ''}`,
      type: logType,
      attachmentName: selectedFile?.name || null,
    })
    setLogActivity("")
    setLogOutput("")
    setSelectedFile(null)
    showToast("Work logged successfully!")
    setSubmitting(false)
    router.refresh()
  }

  async function handleTaskAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !taskTitle.trim()) return
    await addTask({
      fellowId: profile.id,
      fellowName: profile.name,
      district: profile.district,
      title: taskTitle.trim(),
      status: "ongoing",
      dueDate: null,
    })
    setTaskTitle("")
    router.refresh()
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 sm:left-auto sm:translate-x-0 sm:right-4 top-auto sm:top-4 z-50 rounded-xl bg-[hsl(var(--green))] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={`Welcome, ${profile.name}`}
        icon={<span>{locationIcon}</span>}
        description={`${locationLabel} · ${appName}`}
      />

      {/* Weekly deadline */}
      <DeadlineBanner />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 stagger-children">
        <StatCard
          title="Total Logs"
          value={profile.totalLogs || 0}
          icon={<ClipboardList className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="Streak"
          value={`${profile.streak || 0} days`}
          icon={<Flame className="h-4 w-4" />}
          variant="accent"
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks.length}
          icon={<ListTodo className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="Stuck Tasks"
          value={stuckTasks.length}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={stuckTasks.length > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Weekly progress + Workload */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyProgress count={weekCount} />
        <WorkloadMeter
          fellowId={profile.id}
          fellowName={profile.name}
          district={profile.district}
          program={profile.program}
        />
      </div>

      {/* Log Work + Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Log Work */}
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2.5">
              <ClipboardList className="h-5 w-5 text-[hsl(var(--text-3))]" />
              Log This Week&apos;s Work
            </CardTitle>
            <CardDescription>Record what you did and what you produced</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={logCategory} onValueChange={(v) => setLogCategory(v as WorkCategory)}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {WORK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5 rounded-xl border border-[hsl(var(--border))] p-1.5">
                  {LOG_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setLogType(t.value)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                        logType === t.value
                          ? "bg-[hsl(var(--navy))] text-white"
                          : "text-[hsl(var(--text-4))] hover:bg-[hsl(var(--bg-muted))]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-[hsl(var(--text-2))]">What did you do?</label>
                  <button
                    type="button"
                    onClick={() => startVoice('activity')}
                    className={`p-1.5 rounded-lg transition-colors ${listeningActivity ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] animate-pulse' : 'text-[hsl(var(--text-4))] hover:text-[hsl(var(--text-2))] hover:bg-[hsl(var(--bg-muted))]'}`}
                    aria-label="Voice input"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                </div>
                <Textarea
                  value={logActivity}
                  onChange={(e) => setLogActivity(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="e.g., Field visit to block office, meeting with district officials…"
                  required
                />
                <span className="block text-right text-[10px] text-[hsl(var(--text-4))] mt-0.5">{logActivity.length}/500</span>
              </div>

              {/* Output / Deliverable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-semibold text-[hsl(var(--text-2))]">What did you produce?</label>
                  <button
                    type="button"
                    onClick={() => startVoice('output')}
                    className={`p-1.5 rounded-lg transition-colors ${listeningOutput ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] animate-pulse' : 'text-[hsl(var(--text-4))] hover:text-[hsl(var(--text-2))] hover:bg-[hsl(var(--bg-muted))]'}`}
                    aria-label="Voice input"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                </div>
                <Textarea
                  value={logOutput}
                  onChange={(e) => setLogOutput(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="e.g., Submitted draft CDP for education sector, prepared briefing note…"
                />
                <span className="block text-right text-[10px] text-[hsl(var(--text-4))] mt-0.5">{logOutput.length}/500</span>
              </div>

              {/* File upload validation */}
              <div>
                <label className="text-[12px] font-semibold text-[hsl(var(--text-2))] block mb-1.5">Attachment (optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && file.size > 5 * 1024 * 1024) {
                        setFileError("File exceeds 5MB limit. Please choose a smaller file.")
                        e.target.value = ''
                        setSelectedFile(null)
                      } else if (file) {
                        setFileError("")
                        setSelectedFile(file)
                      }
                    }}
                    className="block w-full text-[12px] text-[hsl(var(--text-3))] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[hsl(var(--navy))]/[0.08] file:text-[hsl(var(--navy))] hover:file:bg-[hsl(var(--navy))]/[0.12] file:transition-colors file:cursor-pointer"
                  />
                  {fileError && <p className="mt-1 text-[11px] text-[hsl(var(--red))]">{fileError}</p>}
                  {selectedFile && <p className="text-[11px] text-[hsl(var(--green))]">✓ {selectedFile.name}</p>}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[hsl(var(--text-4))]">{logActivity.length + logOutput.length}/1000</span>
                <Button type="submit" size="sm" loading={submitting}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Log
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2.5">
                  <ListTodo className="h-5 w-5 text-[hsl(var(--green))]" />
                  My Tasks
                </CardTitle>
                <CardDescription>Track your ongoing work items</CardDescription>
              </div>
              <Badge variant="secondary">{activeTasks.length} active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleTaskAdd} className="mb-3 flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a task…"
                className="flex-1"
              />
              <Button type="submit" size="sm">Add</Button>
            </form>
            <div className="space-y-1.5 max-h-56 overflow-auto">
              {tasks.length === 0 ? (
                <EmptyState title="No tasks yet" description="Add your first task above." />
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 rounded-xl border border-[hsl(var(--border))] px-3 py-2.5 hover:bg-[hsl(var(--bg-muted))]/50 transition-colors">
                    <button onClick={() => updateTaskStatus(task.id, task.status === "completed" ? "ongoing" : "completed").then(() => router.refresh())}>
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-[hsl(var(--green))]" />
                      ) : task.status === "stuck" ? (
                        <AlertTriangle className="h-4.5 w-4.5 text-[hsl(var(--red))]" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-[hsl(var(--text-4))]" />
                      )}
                    </button>
                    <span className={`flex-1 text-[13px] ${task.status === "completed" ? "line-through text-[hsl(var(--text-4))]" : "text-[hsl(var(--text-1))] font-medium"}`}>
                      {task.title}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus).then(() => router.refresh())}
                      className="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-[11px] font-medium text-[hsl(var(--text-3))]"
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Done</option>
                      <option value="stuck">Stuck</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <CourseProgress
        fellowId={profile.id}
        program={profile.program}
        progress={courseProg}
      />

      {/* Recent Activity */}
      <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="space-y-3">
            {logs.length === 0 ? (
              <EmptyState title="No logs yet" description="Start logging your weekly work." />
            ) : (
              logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex gap-3">
                  <span className="text-lg shrink-0">
                    {WORK_CATEGORIES.find((c) => c.value === log.category)?.emoji || "📌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-[hsl(var(--text-1))] line-clamp-2">
                        {log.activityDescription || log.description}
                      </p>
                      <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{log.type}</Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[hsl(var(--text-3))]">
                      {log.outputDeliverable && <span className="font-medium">Output: </span>}
                      {log.outputDeliverable ? `${log.outputDeliverable.slice(0, 60)}${log.outputDeliverable.length > 60 ? '...' : ''}` : WORK_CATEGORIES.find((c) => c.value === log.category)?.label} · {formatDate(log.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Programme Progress Card */}
      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle className="flex items-center gap-2.5">
            <GraduationCap className="h-5 w-5 text-[hsl(var(--blue))]" />
            Certificate Programme Progress
          </CardTitle>
          <CardDescription>Track your mandatory programme milestones</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="space-y-2">
            {[
              { label: 'Induction Complete', done: false },
              { label: 'Residency 1', done: false },
              { label: 'Monthly Session 1', done: false },
              { label: 'Capstone Submitted', done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[hsl(var(--bg-muted))]/50">
                <Square className="h-4 w-4 text-[hsl(var(--text-4))]" />
                <span className="text-[13px] font-medium text-[hsl(var(--text-2))]">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-[hsl(var(--text-4))]">4 milestones remaining</p>
        </CardContent>
      </Card>

      {/* Support shortcut */}
      <Card className="border-[hsl(var(--gold))]/15 bg-[hsl(var(--gold-soft))]">
        <CardHeader className="border-b border-[hsl(var(--gold))]/10">
          <CardTitle className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-[hsl(var(--gold))]" />
            Need Help?
          </CardTitle>
          <CardDescription>Raise a support request — knowledge, data, logistics, or technical.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <a href="/fellow/support" className="inline-flex items-center justify-center w-full h-10 rounded-xl bg-[hsl(var(--navy))] text-white font-semibold text-[13px] shadow-sm hover:shadow-md hover:bg-[hsl(var(--navy-light))] active:scale-[0.98] transition-all duration-200">
            Go to Support
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
