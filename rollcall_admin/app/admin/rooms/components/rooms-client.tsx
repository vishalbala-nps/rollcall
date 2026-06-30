"use client"

import { useState, useActionState, useEffect, useRef } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { addRoom, deleteRoom, updateRoom } from "@/app/admin/actions"

type Room = {
  id: number
  name: string
  beacons: { id: number; name: string }[]
}

function EditRoomDialog({ room }: { room: Room }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateRoom, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (!state?.error) setOpen(false)
    }
  }, [state, pending])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={String(room.id)} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Room name</Label>
            <Input id="edit-name" name="name" defaultValue={room.name} required />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddRoomDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(addRoom, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (!state?.error) setOpen(false)
    }
  }, [state, pending])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Room name</Label>
            <Input id="name" name="name" placeholder="e.g. Lab 101" required />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RoomsClient({ rooms }: { rooms: Room[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rooms</h1>
        <p className="text-sm text-muted-foreground">Manage campus rooms</p>
      </div>

      <div className="flex justify-end">
        <AddRoomDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Beacons</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No rooms yet.
                </TableCell>
              </TableRow>
            )}
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">{r.id}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  {r.beacons.length === 0
                    ? <span className="text-sm italic text-muted-foreground">None</span>
                    : <div className="flex flex-wrap gap-1">
                        {r.beacons.map((b) => (
                          <Badge key={b.id} variant="outline">{b.name}</Badge>
                        ))}
                      </div>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <EditRoomDialog room={r} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete room?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{r.name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={async () => {
                              const fd = new FormData()
                              fd.set("id", String(r.id))
                              await deleteRoom(fd)
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
