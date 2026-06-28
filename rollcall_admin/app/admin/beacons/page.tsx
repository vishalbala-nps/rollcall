import { auth } from "@/auth"
import { db } from "@/lib/db"
import { BeaconsClient } from "./components/beacons-client"

export default async function BeaconsPage() {
  const session = await auth()
  const universityId = session!.user.universityId

  const [beacons, rooms] = await Promise.all([
    db.beacon.findMany({
      where: { universityId },
      orderBy: { createdAt: "asc" },
      include: { room: { select: { id: true, name: true } } },
    }),
    db.room.findMany({
      where: { universityId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return <BeaconsClient beacons={beacons} rooms={rooms} />
}
