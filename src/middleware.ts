import { auth } from "@/lib/auth-middleware"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const isAdminRoute = nextUrl.pathname.startsWith("/dashboard")
  const isJuryRoute = nextUrl.pathname.startsWith("/home")


  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Role-based access control
  if (isLoggedIn) {

    // Redirect jury users away from admin routes
    if (isAdminRoute && userRole === "jury") {
      return NextResponse.redirect(new URL("/home", nextUrl))
    }
    // Redirect admin users away from jury routes
    else if (isJuryRoute && userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    // Redirect authenticated users away from login page
    else if (nextUrl.pathname === "/login") {
      const redirectPath = userRole === "admin" ? "/dashboard" : "/home"
      return NextResponse.redirect(new URL(redirectPath, nextUrl))
    }

    else{
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
