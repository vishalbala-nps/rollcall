import { auth } from "@/auth"
import { db } from "@/lib/db"
import { CoursesClient } from "./components/courses-client"

export default async function CoursesPage() {
  const session = await auth()
  const universityId = session!.user.universityId

  const [courses, faculty, batches] = await Promise.all([
    db.course.findMany({
      where: { universityId },
      orderBy: { createdAt: "asc" },
      include: {
        faculties: { select: { id: true, firstName: true, lastName: true, email: true } },
        batches:   { select: { id: true, name: true } },
      },
    }),
    db.user.findMany({
      where: { universityId, role: "Faculty" },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    db.batch.findMany({
      where: { universityId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return <CoursesClient courses={courses} faculty={faculty} batches={batches} />
}
