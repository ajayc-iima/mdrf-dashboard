"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { getLmsCourses } from "@/lib/firestore"
import { PROGRAM_META } from "@/lib/constants"
import type { LmsCourse } from "@/types"
import { BookOpen, ExternalLink } from "lucide-react"

export default function FellowLmsPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<LmsCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    getLmsCourses(profile.program).then((c) => {
      setCourses(c)
      setLoading(false)
    })
  }, [profile])

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ISB LMS" icon={<BookOpen className="h-6 w-6" />} description="Access your course materials and learning resources." />

      {courses.length === 0 ? (
        <EmptyState title="No courses available" description="Course links will appear here once added by your administrator." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="group block">
              <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-[15px] leading-snug flex-1 pr-2">{c.title}</CardTitle>
                    <ExternalLink className="h-4 w-4 text-[hsl(var(--text-4))] group-hover:text-[hsl(var(--navy))] transition-colors shrink-0 mt-0.5" />
                  </div>
                  {c.program && (
                    <Badge variant="secondary" className="text-[10px] w-fit">{PROGRAM_META[c.program].label}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {c.description && <p className="text-[13px] text-[hsl(var(--text-3))] line-clamp-2">{c.description}</p>}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
