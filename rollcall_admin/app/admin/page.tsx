import { auth } from "@/auth"
import { signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const session = await auth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/" })
        }}
      >
        <Button variant="outline" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  )
}
