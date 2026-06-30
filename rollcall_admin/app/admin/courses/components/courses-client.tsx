"use client"

import { useState, useActionState, useEffect, useRef } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Trash2 } from "lucide-react"
import { addCourse, deleteCourse } from "@/app/admin/actions"

type Faculty = { id: number; firstName: string; lastName: string | null; email: string }
type Batch = { id: number; name: string }
type Course = {
  id: number
  name: string
  faculties: Faculty[]
  batches: Batch[]
}

function FacultyPicker({
  faculty,
  selected,
  onToggle,
}: {
  faculty: Faculty[]
  selected: Set<number>
  onToggle: (id: number) => void
}) {
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? faculty.filter((f) => {
        const q = query.toLowerCase()
        return (
          f.firstName.toLowerCase().includes(q) ||
          (f.lastName ?? "").toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q)
        )
      })
    : faculty

  if (faculty.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-md border px-3 py-2">
        No faculty members yet.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto rounded-md border p-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-3 text-center">No matches.</p>
        ) : (
          filtered.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-3 rounded px-2 py-1.5 cursor-pointer hover:bg-muted"
            >
              <input
                type="checkbox"
                className="size-4 rounded accent-primary cursor-pointer"
                checked={selected.has(f.id)}
                onChange={() => onToggle(f.id)}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate">{f.firstName} {f.lastName ?? ""}</span>
                <span className="text-xs text-muted-foreground truncate">{f.email}</span>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

function BatchPicker({
  batches,
  selected,
  onToggle,
}: {
  batches: Batch[]
  selected: Set<number>
  onToggle: (id: number) => void
}) {
  if (batches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-md border px-3 py-2">
        No batches created yet.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto rounded-md border p-1">
      {batches.map((b) => (
        <label
          key={b.id}
          className="flex items-center gap-3 rounded px-2 py-1.5 cursor-pointer hover:bg-muted"
        >
          <input
            type="checkbox"
            className="size-4 rounded accent-primary cursor-pointer"
            checked={selected.has(b.id)}
            onChange={() => onToggle(b.id)}
          />
          <span className="text-sm">{b.name}</span>
        </label>
      ))}
    </div>
  )
}

function AddCourseDialog({
  faculty,
  batches,
}: {
  faculty: Faculty[]
  batches: Batch[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<Set<number>>(new Set())
  const [selectedBatches, setSelectedBatches] = useState<Set<number>>(new Set())
  const [state, action, pending] = useActionState(addCourse, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (open) {
      setSelectedFaculty(new Set())
      setSelectedBatches(new Set())
    }
  }, [open])

  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (!state?.error) setOpen(false)
    }
  }, [state, pending])

  function toggleFaculty(id: number) {
    setSelectedFaculty((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleBatch(id: number) {
    setSelectedBatches((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Course</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {Array.from(selectedFaculty).map((id) => (
            <input key={id} type="hidden" name="facultyIds" value={String(id)} />
          ))}
          {Array.from(selectedBatches).map((id) => (
            <input key={id} type="hidden" name="batchIds" value={String(id)} />
          ))}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Course name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Faculty ({selectedFaculty.size} selected)</Label>
            <FacultyPicker faculty={faculty} selected={selectedFaculty} onToggle={toggleFaculty} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Batches ({selectedBatches.size} selected)</Label>
            <BatchPicker batches={batches} selected={selectedBatches} onToggle={toggleBatch} />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Course"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CoursesClient({
  courses,
  faculty,
  batches,
}: {
  courses: Course[]
  faculty: Faculty[]
  batches: Batch[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Courses</h1>
        <p className="text-sm text-muted-foreground">Manage courses and their assignments</p>
      </div>

      <div className="flex justify-end">
        <AddCourseDialog faculty={faculty} batches={batches} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Batches</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No courses yet.
                </TableCell>
              </TableRow>
            )}
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">{c.id}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {c.faculties.length === 0 ? (
                    <span className="text-sm italic text-muted-foreground">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {c.faculties.map((f) => (
                        <Badge key={f.id} variant="secondary">
                          {f.firstName} {f.lastName ?? ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {c.batches.length === 0 ? (
                    <span className="text-sm italic text-muted-foreground">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {c.batches.map((b) => (
                        <Badge key={b.id} variant="outline">{b.name}</Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete course?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{c.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className={buttonVariants({ variant: "destructive" })}
                          onClick={async () => {
                            const fd = new FormData()
                            fd.set("id", String(c.id))
                            await deleteCourse(fd)
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
