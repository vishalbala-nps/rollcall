"use client"

import React, { useState, useActionState, useEffect, useRef } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Plus, Pencil, RefreshCw, Trash2, Download } from "lucide-react"
import { addBeacon, deleteBeacon, updateBeacon } from "@/app/admin/actions"

type Beacon = {
  id: number
  name: string
  secret: string
  room: { id: number; name: string } | null
}

type Room = { id: number; name: string }

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  let result = ""
  let buf = 0
  let bits = 0
  for (const byte of bytes) {
    buf = (buf << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += chars[(buf >> bits) & 0x1f]
    }
  }
  return result
}

function ProvisioningDialog({ beacon }: { beacon: Beacon }) {
  const [open, setOpen] = useState(false)
  const [ssid, setSsid] = useState("")
  const [wifiPassword, setWifiPassword] = useState("")

  useEffect(() => {
    if (open) { setSsid(""); setWifiPassword("") }
  }, [open])

  function handleDownload(e: React.FormEvent) {
    e.preventDefault()
    const json = {
      ssid,
      password: wifiPassword,
      secret: beacon.secret,
      beaconId: beacon.id.toString(16).toUpperCase(),
      totpRefreshInterval: 30,
    }
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `beacon-${beacon.id.toString(16).toUpperCase()}-provisioning.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Download provisioning JSON">
          <Download className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Download Provisioning JSON</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleDownload} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter the Wi-Fi credentials the beacon will use to connect.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prov-ssid">Wi-Fi SSID</Label>
            <Input
              id="prov-ssid"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="e.g. Airtel_Bala"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prov-password">Wi-Fi Password</Label>
            <Input
              id="prov-password"
              type="password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit">
            <Download className="size-4" />
            Download JSON
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditBeaconDialog({ beacon, rooms }: { beacon: Beacon; rooms: Room[] }) {
  const [open, setOpen] = useState(false)
  const [secret, setSecret] = useState(beacon.secret)
  const [state, action, pending] = useActionState(updateBeacon, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (open) setSecret(beacon.secret)
  }, [open, beacon.secret])

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Beacon</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={String(beacon.id)} />
          <input type="hidden" name="secret" value={secret} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-beacon-name">Name</Label>
            <Input id="edit-beacon-name" name="name" defaultValue={beacon.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Secret</Label>
            <div className="flex gap-2">
              <Input value={secret} readOnly className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSecret(generateSecret())}
                title="Regenerate secret"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-beacon-room">Room (optional)</Label>
            <Select name="roomId" defaultValue={beacon.room ? String(beacon.room.id) : ""}>
              <SelectTrigger id="edit-beacon-room">
                <SelectValue placeholder="No room assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No room assigned</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function AddBeaconDialog({ rooms }: { rooms: Room[] }) {
  const [open, setOpen] = useState(false)
  const [secret, setSecret] = useState("")
  const [state, action, pending] = useActionState(addBeacon, undefined)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (open) setSecret(generateSecret())
  }, [open])

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
          Add Beacon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Beacon</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Lecture Hall A — Beacon 1" required />
          </div>
          <input type="hidden" name="secret" value={secret} />
          <div className="flex flex-col gap-1.5">
            <Label>Secret</Label>
            <div className="flex gap-2">
              <Input
                value={secret}
                readOnly
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSecret(generateSecret())}
                title="Regenerate secret"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="roomId">Room (optional)</Label>
            <Select name="roomId">
              <SelectTrigger id="roomId">
                <SelectValue placeholder="No room assigned" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Beacon"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BeaconsClient({
  beacons,
  rooms,
}: {
  beacons: Beacon[]
  rooms: Room[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Beacons</h1>
        <p className="text-sm text-muted-foreground">
          Register attendance beacons for your campus
        </p>
      </div>

      <div className="flex justify-end">
        <AddBeaconDialog rooms={rooms} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Secret</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {beacons.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No beacons yet.
                </TableCell>
              </TableRow>
            )}
            {beacons.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">{b.id}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="font-mono text-sm">{b.secret}</TableCell>
                <TableCell className="text-muted-foreground">
                  {b.room?.name ?? <span className="italic">Unassigned</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ProvisioningDialog beacon={b} />
                    <EditBeaconDialog beacon={b} rooms={rooms} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete beacon?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{b.name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={async () => {
                              const fd = new FormData()
                              fd.set("id", String(b.id))
                              await deleteBeacon(fd)
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
