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
import { Plus, Search, Trash2, Users } from "lucide-react"
import { addBatch, deleteBatch, setBatchStudents } from "@/app/admin/actions"

type Student = {
  id: number
  firstName: string
  lastName: string | null
  email: string
  batchId: number | null
}

type Batch = {
  id: number
  name: string
  students: { id: number; firstName: string; lastName: string | null }[]
}

function StudentPicker({
  students,
  selected,
  onToggle,
  currentBatchId,
}: {
  students: Student[]
  selected: Set<number>
  onToggle: (id: number) => void
  currentBatchId?: number
}) {
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? students.filter((s) => {
        const q = query.toLowerCase()
        return (
          s.firstName.toLowerCase().includes(q) ||
          (s.lastName ?? "").toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        )
      })
    : students

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto rounded-md border p-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-3 text-center">
            {query ? "No students match your search." : "No students yet."}
          </p>
        ) : (
          filtered.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-3 rounded px-2 py-1.5 cursor-pointer hover:bg-muted"
            >
              <input
                type="checkbox"
                className="size-4 rounded accent-primary cursor-pointer"
                checked={selected.has(s.id)}
                onChange={() => onToggle(s.id)}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm truncate">
                  {s.firstName} {s.lastName ?? ""}
                </span>
                <span className="text-xs text-muted-foreground truncate">{s.email}</span>
              </div>
              {s.batchId !== null && s.batchId !== currentBatchId && (
                <span className="text-xs text-muted-foreground italic shrink-0">already in another batch</span>
              )}
            </label>
          ))
        )}
      </div>
    </div>
  )
}

function AddBatchDialog({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [state, action, pending] = useActionState(addBatch, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (open) setSelected(new Set())
  }, [open])

  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (!state?.error) setOpen(false)
    }
  }, [state, pending])

  function toggle(id: number) {
    setSelected((prev) => {
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
          Add Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Batch</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="studentIds" value={String(id)} />
          ))}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Batch name</Label>
            <Input id="name" name="name" placeholder="e.g. CS 2024" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Students ({selected.size} selected)</Label>
            <StudentPicker students={students} selected={selected} onToggle={toggle} />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Batch"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ManageStudentsDialog({ batch, allStudents }: { batch: Batch; allStudents: Student[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [state, action, pending] = useActionState(setBatchStudents, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (open) setSelected(new Set(batch.students.map((s) => s.id)))
  }, [open, batch.students])

  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (!state?.error) setOpen(false)
    }
  }, [state, pending])

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Users className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Students — {batch.name}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="batchId" value={String(batch.id)} />
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="studentIds" value={String(id)} />
          ))}
          <div className="flex flex-col gap-1.5">
            <Label>{selected.size} selected</Label>
            <StudentPicker
              students={allStudents}
              selected={selected}
              onToggle={toggle}
              currentBatchId={batch.id}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : `Save (${selected.size} selected)`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BatchesClient({
  batches,
  students,
}: {
  batches: Batch[]
  students: Student[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Batches</h1>
        <p className="text-sm text-muted-foreground">Manage student cohorts</p>
      </div>

      <div className="flex justify-end">
        <AddBatchDialog students={students} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>No of Students</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No batches yet.
                </TableCell>
              </TableRow>
            )}
            {batches.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">{b.id}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>
                  {b.students.length}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <ManageStudentsDialog batch={b} allStudents={students} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete batch?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{b.name}&quot; and unassign all{" "}
                            {b.students.length} student{b.students.length !== 1 ? "s" : ""} from it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={async () => {
                              const fd = new FormData()
                              fd.set("id", String(b.id))
                              await deleteBatch(fd)
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
