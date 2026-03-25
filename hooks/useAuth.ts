"use client";

import { useAuthContext } from "@/lib/auth/auth-context";

export function useAuth() {
  const { user, loading, mode } = useAuthContext();
  return { user, loading, mode };
}
