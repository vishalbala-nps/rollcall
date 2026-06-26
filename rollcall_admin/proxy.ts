import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user
  const role = req.auth?.user?.role

  if (nextUrl.pathname === "/") {
    if (!isLoggedIn) return NextResponse.next()
    if (role === "Admin") return NextResponse.rewrite(new URL("/admin", nextUrl))
    if (role === "Faculty") return NextResponse.rewrite(new URL("/teacher", nextUrl))
    return NextResponse.next()
  }

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl))
    if (role !== "Admin") return NextResponse.redirect(new URL("/", nextUrl))
  }

  if (nextUrl.pathname.startsWith("/teacher")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl))
    if (role !== "Faculty") return NextResponse.redirect(new URL("/", nextUrl))
  }
})

export const config = {
  matcher: ["/", "/admin/:path*", "/teacher/:path*"],
}