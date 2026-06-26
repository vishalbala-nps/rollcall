import "dotenv/config"
import { createInterface } from "readline/promises"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const rl = createInterface({ input: process.stdin, output: process.stdout })

const name = await rl.question("University name: ")
rl.close()

if (!name.trim()) {
  console.error("Name cannot be empty.")
  process.exit(1)
}

const university = await db.university.create({ data: { name: name.trim() } })
console.log(`Created university: [${university.id}] ${university.name}`)

await db.$disconnect()
