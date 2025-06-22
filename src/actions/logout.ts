// actions/logout.ts
"use server";

import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logoutAction() {
  try {
    await signOut({
      redirect: true,
      redirectTo: "/login"
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Fallback redirect if signOut fails
    redirect("/login");
  }
}
