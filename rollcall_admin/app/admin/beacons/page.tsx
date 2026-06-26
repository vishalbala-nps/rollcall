import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { addBeacon } from "../actions"

export default async function BeaconsPage() {
  const beacons = await db.beacon.findMany({ orderBy: { createdAt: "asc" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Beacons</h1>
        <p className="text-sm text-muted-foreground">
          Register attendance beacons for your campus
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Beacon</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addBeacon} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="secret">Secret</Label>
              <Input id="secret" name="secret" placeholder="Paste the beacon secret" required />
            </div>
            <Button type="submit">Add Beacon</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Secret</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beacons.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No beacons yet.
                </TableCell>
              </TableRow>
            )}
            {beacons.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.id}</TableCell>
                <TableCell className="font-mono text-sm">{b.secret}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
