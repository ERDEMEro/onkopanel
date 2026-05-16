import { useState, useEffect, useCallback, useContext, createContext, createElement } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  registerWithPassword: (email: string, password: string, firstName?: string, lastName?: string, isDoctor?: boolean) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loginWithReplit: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { user: AuthUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const loginWithPassword = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { user?: AuthUser; error?: string };
      if (!res.ok) return { error: data.error ?? "Giriş başarısız." };
      setUser(data.user ?? null);
      return {};
    } catch {
      return { error: "Sunucuya bağlanılamadı." };
    }
  }, []);

  const registerWithPassword = useCallback(async (email: string, password: string, firstName?: string, lastName?: string, isDoctor?: boolean): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, firstName, lastName, isDoctor }),
      });
      const data = await res.json() as { user?: AuthUser; error?: string };
      if (!res.ok) return { error: data.error ?? "Kayıt başarısız." };
      setUser(data.user ?? null);
      return {};
    } catch {
      return { error: "Sunucuya bağlanılamadı." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
  }, []);

  const loginWithReplit = useCallback(() => {
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "") || "/";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const value: AuthState = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refresh,
    loginWithPassword,
    registerWithPassword,
    logout,
    loginWithReplit,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
