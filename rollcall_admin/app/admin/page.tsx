import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Radio, GraduationCap, Shield } from "lucide-react"

export default async function AdminDashboard() {
  const session = await auth()
  const universityId = session!.user.universityId

  const [total, admins, faculty, students, beacons, university] = await Promise.all([
    db.user.count({ where: { universityId } }),
    db.user.count({ where: { universityId, role: "Admin" } }),
    db.user.count({ where: { universityId, role: "Faculty" } }),
    db.user.count({ where: { universityId, role: "Student" } }),
    db.beacon.count({ where: { universityId } }),
    db.university.findUnique({ where: { id: universityId } }),
  ])

  const stats = [
    { label: "Total Users", value: total, icon: Users },
    { label: "Admins", value: admins, icon: Shield },
    { label: "Teachers", value: faculty, icon: GraduationCap },
    { label: "Students", value: students, icon: Users },
    { label: "Beacons", value: beacons, icon: Radio },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{university?.name ?? "Dashboard"}</h1>
        <p className="text-sm text-muted-foreground">Overview of your institution</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
