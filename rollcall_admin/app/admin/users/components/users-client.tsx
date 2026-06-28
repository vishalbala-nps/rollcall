"use client"

import { useState, useActionState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { buttonVariants } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import { addUser, deleteUser } from "@/app/admin/actions"

type User = {
  id: number
  email: string
  firstName: string
  lastName: string | null
  role: "Admin" | "Faculty" | "Student"
}

const tabs = [
  { label: "Students", role: "Student" },
  { label: "Teachers", role: "Faculty" },
  { label: "Admins", role: "Admin" },
] as const


function UserTable({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  if (users.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border text-sm text-muted-foreground">
        No users in this group yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = String(u.id) === currentUserId
            return (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {u.id}
                </TableCell>
                <TableCell className="font-medium">
                  {u.firstName} {u.lastName ?? ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {!isSelf && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {u.firstName} {u.lastName ?? ""}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={async () => {
                              const fd = new FormData()
                              fd.set("id", String(u.id))
                              await deleteUser(fd)
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function AddUserDialog({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(addUser, undefined)
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
          Add {role === "Faculty" ? "Teacher" : role}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {role === "Faculty" ? "Teacher" : role}</DialogTitle>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Adding…" : "Add User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UsersClient({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<string>("Student")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage admins, teachers and students
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.role} value={t.role}>
                {t.label}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {users.filter((u) => u.role === t.role).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <AddUserDialog role={activeTab} />
        </div>

        {tabs.map((t) => (
          <TabsContent key={t.role} value={t.role} className="mt-4">
            <UserTable
              users={users.filter((u) => u.role === t.role)}
              currentUserId={currentUserId}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
