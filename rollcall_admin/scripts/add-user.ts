import "dotenv/config"
import { createInterface } from "readline/promises"
import bcrypt from "bcryptjs"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const rl = createInterface({ input: process.stdin, output: process.stdout })

const universities = await db.university.findMany({ orderBy: { id: "asc" } })
if (universities.length === 0) {
  console.error("No universities found. Run add-university first.")
  process.exit(1)
}

console.log("\nUniversities:")
for (const u of universities) console.log(`  [${u.id}] ${u.name}`)

const universityIdStr = await rl.question("\nUniversity ID: ")
const universityId = parseInt(universityIdStr)
if (!universities.find((u) => u.id === universityId)) {
  console.error("Invalid university ID.")
  process.exit(1)
}

const email = await rl.question("Email: ")
const password = await rl.question("Password: ")
const firstName = await rl.question("First name: ")
const lastName = await rl.question("Last name (optional): ")
const roleInput = await rl.question("Role (Admin / Faculty / Student): ")
rl.close()

const role = roleInput.trim() as "Admin" | "Faculty" | "Student"
if (!["Admin", "Faculty", "Student"].includes(role)) {
  console.error("Invalid role. Must be Admin, Faculty, or Student.")
  process.exit(1)
}

const hashed = await bcrypt.hash(password, 10)

const user = await db.user.create({
  data: {
    email: email.trim(),
    password: hashed,
    firstName: firstName.trim(),
    lastName: lastName.trim() || null,
    role,
    universityId,
  },
})

console.log(`Created user: [${user.id}] ${user.firstName} <${user.email}> — ${user.role}`)

await db.$disconnect()
