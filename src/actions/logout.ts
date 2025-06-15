// actions/logout.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  try {
    // In Next.js 15, cookies() returns a Promise
    const cookieStore = await cookies();
    
    // Delete the authentication cookie
    cookieStore.delete("authjs.session-token");
    
    // You can delete multiple cookies
    // cookieStore.delete("user-role");
    // cookieStore.delete("session-id");
    
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  // Redirect after logout
  redirect("/login");
}
