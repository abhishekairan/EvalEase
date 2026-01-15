// actions/logout.ts
"use server";

import { signOut } from "@/lib/auth";

export async function logoutAction() {
  await signOut({
    redirect: true,
    redirectTo: "/login"
  });
}
