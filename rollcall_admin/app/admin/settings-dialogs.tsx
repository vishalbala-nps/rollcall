"use client"

import { useState, useActionState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { KeyRound } from "lucide-react"
import { changePassword } from "@/app/admin/actions"

function ResetPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [state, action, pending] = useActionState(changePassword, {})
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (open) {
      setNewPassword("")
      setConfirmPassword("")
    }
  }, [open])

  useEffect(() => {
    if (pending) { wasSubmitting.current = true; return }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (!state?.error) onOpenChange(false)
    }
  }, [state, pending, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="newPassword" value={newPassword} />
          <input type="hidden" name="confirmPassword" value={confirmPassword} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rp-new">New password</Label>
            <Input
              id="rp-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rp-confirm">Confirm new password</Label>
            <Input
              id="rp-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted text-left"
              onClick={() => { onOpenChange(false); setResetPasswordOpen(true) }}
            >
              <KeyRound className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">Reset Password</p>
                <p className="text-xs text-muted-foreground">Change your account password</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ResetPasswordDialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen} />
    </>
  )
}
