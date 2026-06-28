import { auth } from "@/auth"
import { db } from "@/lib/db"
import { CoursesClient } from "./components/courses-client"

export default async function CoursesPage() {
  const session = await auth()
  const universityId = session!.user.universityId

  const [courses, faculty, rooms, batches] = await Promise.all([
    db.course.findMany({
      where: { universityId },
      orderBy: { createdAt: "asc" },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true } },
        room:    { select: { id: true, name: true } },
        batches: { select: { id: true, name: true } },
      },
    }),
    db.user.findMany({
      where: { universityId, role: "Faculty" },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    db.room.findMany({
      where: { universityId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.batch.findMany({
      where: { universityId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return <CoursesClient courses={courses} faculty={faculty} rooms={rooms} batches={batches} />
}
