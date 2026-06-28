"use server"

import { auth, signOut } from "@/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function addUser(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await auth()
  const universityId = session!.user.universityId

  const email = (formData.get("email") as string).trim()
  const role = formData.get("role") as "Admin" | "Faculty" | "Student"
  const lastName = (formData.get("lastName") as string).trim() || null
  const hashed = await bcrypt.hash(formData.get("password") as string, 10)

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "A user with this email already exists." }

  try {
    await db.user.create({
      data: {
        email,
        password: hashed,
        firstName: (formData.get("firstName") as string).trim(),
        lastName,
        role,
        universityId,
      },
    })
  } catch {
    return { error: "Failed to create user. Please try again." }
  }

  revalidatePath("/admin", "layout")
}

export async function deleteUser(formData: FormData) {
  const session = await auth()
  const id = Number(formData.get("id"))

  // Never let an admin delete their own account.
  if (String(id) === session!.user.id) return

  await db.user.deleteMany({
    where: { id, universityId: session!.user.universityId },
  })

  revalidatePath("/admin", "layout")
}

export async function addBeacon(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await auth()
  const universityId = session!.user.universityId
  const name = (formData.get("name") as string).trim()
  const secret = (formData.get("secret") as string).trim()
  const roomIdRaw = formData.get("roomId") as string
  const roomId = roomIdRaw ? Number(roomIdRaw) : null
  if (!name) return { error: "Name is required." }
  if (!secret) return { error: "Secret is required." }
  try {
    await db.beacon.create({ data: { name, secret, universityId, roomId } })
  } catch {
    return { error: "Failed to add beacon. The secret may already be in use." }
  }
  revalidatePath("/admin", "layout")
}

export async function deleteBeacon(formData: FormData) {
  const session = await auth()
  const universityId = session!.user.universityId
  const id = Number(formData.get("id"))
  await db.beacon.deleteMany({ where: { id, universityId } })
  revalidatePath("/admin", "layout")
}

export async function addRoom(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await auth()
  const universityId = session!.user.universityId
  const name = (formData.get("name") as string).trim()
  if (!name) return { error: "Room name is required." }
  try {
    await db.room.create({ data: { name, universityId } })
  } catch {
    return { error: "Failed to create room. Please try again." }
  }
  revalidatePath("/admin", "layout")
}

export async function deleteRoom(formData: FormData) {
  const session = await auth()
  const id = Number(formData.get("id"))
  await db.room.deleteMany({ where: { id, universityId: session!.user.universityId } })
  revalidatePath("/admin", "layout")
}

export async function addCourse(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await auth()
  const universityId = session!.user.universityId
  const name = (formData.get("name") as string).trim()
  const facultyId = Number(formData.get("facultyId"))
  const roomIdRaw = formData.get("roomId") as string
  const roomId = roomIdRaw ? Number(roomIdRaw) : null
  if (!name) return { error: "Course name is required." }
  if (!facultyId) return { error: "Please select a faculty member." }
  try {
    await db.course.create({
      data: { name, universityId, facultyId, roomId },
    })
  } catch {
    return { error: "Failed to create course. Please try again." }
  }
  revalidatePath("/admin", "layout")
}

export async function deleteCourse(formData: FormData) {
  const session = await auth()
  const id = Number(formData.get("id"))
  await db.course.deleteMany({ where: { id, universityId: session!.user.universityId } })
  revalidatePath("/admin", "layout")
}

export async function addBatch(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await auth()
  const universityId = session!.user.universityId
  const name = (formData.get("name") as string).trim()
  const studentIds = formData.getAll("studentIds").map(Number)
  if (!name) return { error: "Batch name is required." }
  try {
    const batch = await db.batch.create({ data: { name, universityId } })
    if (studentIds.length > 0) {
      await db.user.updateMany({ where: { id: { in: studentIds } }, data: { batchId: batch.id } })
    }
  } catch {
    return { error: "Failed to create batch. Please try again." }
  }
  revalidatePath("/admin", "layout")
}

export async function deleteBatch(formData: FormData) {
  const session = await auth()
  const universityId = session!.user.universityId
  const id = Number(formData.get("id"))
  await db.user.updateMany({ where: { batchId: id }, data: { batchId: null } })
  await db.batch.deleteMany({ where: { id, universityId } })
  revalidatePath("/admin", "layout")
}

export async function setBatchStudents(
  _: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const batchId = Number(formData.get("batchId"))
  const studentIds = formData.getAll("studentIds").map(Number)
  try {
    await db.user.updateMany({ where: { batchId }, data: { batchId: null } })
    if (studentIds.length > 0) {
      await db.user.updateMany({ where: { id: { in: studentIds } }, data: { batchId } })
    }
  } catch {
    return { error: "Failed to update students. Please try again." }
  }
  revalidatePath("/admin", "layout")
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
