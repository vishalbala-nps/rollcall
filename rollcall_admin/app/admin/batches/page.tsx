import { auth } from "@/auth"
import { db } from "@/lib/db"
import { BatchesClient } from "./components/batches-client"

export default async function BatchesPage() {
  const session = await auth()
  const universityId = session!.user.universityId

  const [batches, students] = await Promise.all([
    db.batch.findMany({
      where: { universityId },
      orderBy: { createdAt: "asc" },
      include: {
        students: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    db.user.findMany({
      where: { universityId, role: "Student" },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true, batchId: true },
    }),
  ])

  return <BatchesClient batches={batches} students={students} />
}
