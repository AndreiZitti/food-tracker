"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { fullSync } from "@/lib/db/sync-service";
import type { User } from "@supabase/supabase-js";

type AuthMode = "guest" | "authenticated";

interface AuthContextValue {
  mode: AuthMode;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("guest");
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
      try {
        const {
          data: { user: fetchedUser },
        } = await supabase.auth.getUser();
        const userId = fetchedUser?.id ?? null;

        if (userId !== currentUserIdRef.current) {
          currentUserIdRef.current = userId;
          setUser(fetchedUser);
          setMode(fetchedUser ? "authenticated" : "guest");
        } else {
          // Even if user didn't change, set mode based on current state
          setMode(fetchedUser ? "authenticated" : "guest");
        }
      } catch {
        // If Supabase is unreachable, default to guest mode
        setMode("guest");
        setUser(null);
        currentUserIdRef.current = null;
      }
      setLoading(false);
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;
      // Only update user state when the user ID actually changes
      // This prevents re-renders on TOKEN_REFRESHED events
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        setUser(session?.user ?? null);
        setMode(session?.user ? "authenticated" : "guest");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        currentUserIdRef.current = data.user.id;
        setUser(data.user);
        setMode("authenticated");
        // Trigger initial sync from IndexedDB to Supabase
        fullSync().catch(console.error);
      }

      return {};
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    currentUserIdRef.current = null;
    setUser(null);
    setMode("guest");
    // Intentionally keep local IndexedDB data intact
  }, [supabase]);

  const value: AuthContextValue = {
    mode,
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
