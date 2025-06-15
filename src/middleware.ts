// middleware.ts
import { auth } from "@/lib/auth-middleware" // Use the middleware-specific config
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Public routes
  const isPublicRoute = ["/login", "/register", "/"].includes(nextUrl.pathname)

  // Role-specific protected routes
  const isAdminRoute = nextUrl.pathname.startsWith("/dashboard")
  const isJuryRoute = nextUrl.pathname.startsWith("/home")

  // Redirect to login if accessing protected route without authentication
  if ((isAdminRoute || isJuryRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Role-based access control
  if (isLoggedIn) {
    // Redirect admin users away from jury routes
    if (isJuryRoute && userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    // Redirect jury users away from admin routes
    if (isAdminRoute && userRole === "jury") {
      return NextResponse.redirect(new URL("/home", nextUrl))
    }

    // Redirect authenticated users away from login page
    if (nextUrl.pathname === "/login") {
      const redirectPath = userRole === "admin" ? "/dashboard" : "/home"
      return NextResponse.redirect(new URL(redirectPath, nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
