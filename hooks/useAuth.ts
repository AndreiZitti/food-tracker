"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the Supabase client to prevent recreation on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Track current user ID to prevent unnecessary state updates
  const currentUserIdRef = useRef<string | null>(null);
  const authInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (authInitializedRef.current) return;
    authInitializedRef.current = true;

    const initAuth = async () => {
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      const userId = fetchedUser?.id ?? null;

      // Only update if different from current
      if (userId !== currentUserIdRef.current) {
        currentUserIdRef.current = userId;
        setUser(fetchedUser);
      }
      setLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;
      // Only update user state when the user ID actually changes
      // This prevents re-renders on TOKEN_REFRESHED events
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading, supabase };
}
