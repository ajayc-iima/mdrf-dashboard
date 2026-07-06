"use client"

import { useState, useEffect } from "react"
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
  AlertTriangle, CheckCircle2, Circle, HelpCircle,
} from "lucide-react"

export default function FellowDashboard() {
  const { profile } = useAuth()
  const { logs, tasks, loading } = useFellowData(profile?.id)
  const weekCount = useWeekLogCount(profile?.id)
  const courseProg = useCourseProgress(profile?.id)

  // Form state
  const [logCategory, setLogCategory] = useState<WorkCategory>("fieldwork")
  const [logType, setLogType] = useState<LogType>("completed")
  const [logDescription, setLogDescription] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState("")

  if (loading || !profile) {
    return (
      <div className="space-y-6 stagger-children">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
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
    if (!profile || !logDescription.trim()) return
    setSubmitting(true)
    await addWorkLog({
      fellowId: profile.id,
      fellowName: profile.name,
      district: profile.district,
      constituency: isMLRF ? (profile.constituencies?.[0] || "") : profile.district,
      program: profile.program,
      date: new Date(),
      category: logCategory,
      description: logDescription.trim(),
      type: logType,
    })
    setLogDescription("")
    showToast("Work logged successfully!")
    setSubmitting(false)
    // useFellowData will re-fetch on next render — force via key trick isn't needed,
    // we can reload with a simple counter if needed. For now, rely on hooks re-running
    // by bumping a state counter.
    window.location.reload()
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
    window.location.reload()
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 sm:left-auto sm:translate-x-0 sm:right-4 top-auto sm:top-4 z-50 rounded-xl bg-[hsl(var(--green))] px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-fade-in">
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
        {/* Log Work (§3.1) */}
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[hsl(var(--text-3))]" />
              Log This Week&apos;s Work
            </CardTitle>
            <CardDescription>Record your activities — completed, ongoing, or planned</CardDescription>
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
                <div className="flex gap-2 rounded-lg border border-[hsl(var(--border))] p-2">
                  {LOG_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setLogType(t.value)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
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

              <Textarea
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe your activity…"
                required
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--text-4))]">{logDescription.length}/500</span>
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
                <CardTitle className="flex items-center gap-2">
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
                  <div key={task.id} className="flex items-center gap-2.5 rounded-lg border border-[hsl(var(--border))] px-3 py-2 hover:bg-[hsl(var(--bg-muted))]/50 transition-colors">
                    <button onClick={() => updateTaskStatus(task.id, task.status === "completed" ? "ongoing" : "completed").then(() => window.location.reload())}>
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-[hsl(var(--green))]" />
                      ) : task.status === "stuck" ? (
                        <AlertTriangle className="h-4.5 w-4.5 text-[hsl(var(--red))]" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-[hsl(var(--text-4))]" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${task.status === "completed" ? "line-through text-[hsl(var(--text-4))]" : "text-[hsl(var(--text-1))]"}`}>
                      {task.title}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus).then(() => window.location.reload())}
                      className="rounded border border-[hsl(var(--border))] bg-transparent px-1.5 py-0.5 text-xs text-[hsl(var(--text-3))]"
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
                      <p className="text-sm text-[hsl(var(--text-1))] line-clamp-2">{log.description}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{log.type}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-[hsl(var(--text-4))]">
                      {WORK_CATEGORIES.find((c) => c.value === log.category)?.label} · {formatDate(log.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Support shortcut */}
      <Card className="border-[hsl(var(--gold))/0.2] bg-[hsl(var(--gold-soft))]">
        <CardHeader className="border-b border-[hsl(var(--gold))/0.1]">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[hsl(var(--gold))]" />
            Need Help?
          </CardTitle>
          <CardDescription>Raise a support request — knowledge, data, logistics, or technical.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <a href="/fellow/support" className="inline-flex items-center justify-center w-full h-10 rounded-xl bg-[hsl(var(--navy))] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:brightness-110 active:brightness-90 transition-all duration-200">
            Go to Support
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
