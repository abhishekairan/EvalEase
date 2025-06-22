// actions/logout.ts
"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logoutAction() {
  try {
    const cookieStore = await cookies()
    
    // Delete all auth-related cookies
    cookieStore.delete("authjs.session-token")
    cookieStore.delete("__Secure-authjs.session-token") // For HTTPS
    cookieStore.delete("authjs.csrf-token")
    cookieStore.delete("__Secure-authjs.csrf-token") // For HTTPS
    
    console.log("Logout successful, cookies cleared")
  } catch (error) {
    console.error("Logout error:", error)
  }
  
  // Always redirect, even if cookie deletion fails
  redirect("/login")
}
