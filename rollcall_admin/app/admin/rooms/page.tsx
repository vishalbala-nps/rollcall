import { auth } from "@/auth"
import { db } from "@/lib/db"
import { RoomsClient } from "./components/rooms-client"

export default async function RoomsPage() {
  const session = await auth()
  const universityId = session!.user.universityId

  const rooms = await db.room.findMany({
    where: { universityId },
    orderBy: { createdAt: "asc" },
    include: { courses: { select: { id: true, name: true } } },
  })

  return <RoomsClient rooms={rooms} />
}
