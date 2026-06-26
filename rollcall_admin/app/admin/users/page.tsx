import { auth } from "@/auth"
import { db } from "@/lib/db"
import { UsersClient } from "@/app/admin/users/components/users-client"

export default async function UsersPage() {
  const session = await auth()
  const universityId = session!.user.universityId
  const currentUserId = session!.user.id ?? ""

  const users = await db.user.findMany({
    where: { universityId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })

  return <UsersClient users={users} currentUserId={currentUserId} />
}
