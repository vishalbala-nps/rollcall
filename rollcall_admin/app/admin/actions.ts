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

export async function addBeacon(formData: FormData) {
  const secret = (formData.get("secret") as string).trim()
  await db.beacon.create({ data: { secret } })
  revalidatePath("/admin", "layout")
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
