"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createNote,
  getNotes,
  getNoteComments,
  addNoteComment,
} from "@/lib/firestore"
import { formatDate } from "@/lib/utils"
import type { Note, NoteComment, NoteStatus } from "@/types"
import {
  BookOpen,
  Plus,
  MessageSquare,
  Calendar,
  Tag,
  FileText,
  Send,
  X,
  User,
} from "lucide-react"

export default function NotesPage() {
  const { profile } = useAuth()
  const [myNotes, setMyNotes] = useState<Note[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [comments, setComments] = useState<NoteComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Create form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    if (!profile) return
    setLoading(true)
    setError(null)
    try {
      const [my, all] = await Promise.all([
        getNotes({ authorId: profile.id }),
        getNotes({ status: "published" }),
      ])
      setMyNotes(my)
      setAllNotes(all)
    } catch (err: any) {
      setError(err?.message || "Failed to load notes")
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      await createNote({
        authorId: profile.id,
        authorName: profile.name,
        program: profile.program,
        title: title.trim(),
        content: content.trim(),
        fileUrl: null,
        status: "draft",
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      })
      setTitle("")
      setContent("")
      setTags("")
      setShowCreate(false)
      await loadData()
    } catch (err: any) {
      setError(err?.message || "Failed to create note")
    }
    setSubmitting(false)
  }

  async function handlePublish(note: Note) {
    const { updateNote } = await import("@/lib/firestore")
    await updateNote(note.id, { status: "published" })
    await loadData()
    if (selectedNote?.id === note.id) {
      setSelectedNote({ ...note, status: "published" })
    }
  }

  async function loadComments(noteId: string) {
    const data = await getNoteComments(noteId)
    setComments(data)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !selectedNote || !newComment.trim()) return
    setSubmitting(true)
    await addNoteComment({
      noteId: selectedNote.id,
      authorId: profile.id,
      authorName: profile.name,
      content: newComment.trim(),
    })
    setNewComment("")
    await loadComments(selectedNote.id)
    setSubmitting(false)
  }

  function openDetail(note: Note) {
    setSelectedNote(note)
    loadComments(note.id)
  }

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Field Notes
            </h1>
          </div>
        </div>
        <Card className="border-[#FF453A]/30">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Could not load notes</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {error}
            </p>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Field Notes
          </h1>
          <p className="text-muted-foreground">
            Share research findings and field insights with the programme
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showCreate ? "Cancel" : "New Field Note"}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-[#FF9F0A]/20 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FF9F0A]" />
              Create Field Note
            </CardTitle>
            <CardDescription>Document your research findings and field experiences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Community Health Patterns in East Khasi Hills"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Describe your findings, methodology, and key observations..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., health, fieldwork, khasi hills"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  <Send className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Field Note Detail */}
      {selectedNote && (
        <Card className="border-primary/20 animate-fade-in-up">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{selectedNote.title}</CardTitle>
                <CardDescription className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {selectedNote.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(selectedNote.createdAt)}
                  </span>
                  <Badge variant={selectedNote.status === "published" ? "success" : "warning"}>
                    {selectedNote.status}
                  </Badge>
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNote(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tags */}
            {selectedNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedNote.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" /> {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{selectedNote.content}</p>
            </div>

            {/* Publish button for own drafts */}
            {selectedNote.authorId === profile.id && selectedNote.status === "draft" && (
              <div className="border-t pt-4">
                <Button onClick={() => handlePublish(selectedNote)} variant="success">
                  Publish Field Note
                </Button>
              </div>
            )}

            {/* Comments */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </h4>

              <div className="space-y-3 max-h-64 overflow-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{c.authorName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" loading={submitting} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Published ({allNotes.length})</TabsTrigger>
          <TabsTrigger value="mine">My Field Notes ({myNotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {allNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No published field notes yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Be the first to share your research findings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
              {allNotes.map((note) => (
                <Card
                  key={note.id}
                  className="cursor-pointer group"
                  onClick={() => openDetail(note)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                      {note.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3" /> {note.authorName}
                      <span className="text-muted-foreground/40">|</span>
                      <Calendar className="h-3 w-3" /> {formatDate(note.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {note.content}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          {myNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">You haven&apos;t created any field notes yet</p>
                <Button className="mt-3" onClick={() => setShowCreate(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Field Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
              {myNotes.map((note) => (
                <Card
                  key={note.id}
                  className="cursor-pointer group"
                  onClick={() => openDetail(note)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {note.title}
                      </CardTitle>
                      <Badge variant={note.status === "published" ? "success" : "warning"} className="shrink-0 ml-2">
                        {note.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" /> {formatDate(note.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {note.content}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
