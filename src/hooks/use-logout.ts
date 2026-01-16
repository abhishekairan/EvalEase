"use client";

import { logoutAction } from "@/actions/logout";
import { useState } from "react";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutAction();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return { handleLogout, isLoggingOut };
}
