// actions/logout.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    
    // Delete all possible auth cookie variations
    const cookieNames = [
      "authjs.session-token",
      "__Secure-authjs.session-token", // HTTPS version
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token", // HTTPS version
      "next-auth.session-token",
      "__Secure-next-auth.session-token"
    ];
    
    cookieNames.forEach(name => {
      try {
        cookieStore.delete(name);
        // Also try with explicit options for production
        cookieStore.set(name, '', {
          expires: new Date(0),
          path: '/',
          domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      } catch (error) {
        console.log(`Failed to delete cookie ${name}:`, error);
      }
    });
    
    console.log("Logout successful, cookies cleared");
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  // Always redirect
  redirect("/login");
}
