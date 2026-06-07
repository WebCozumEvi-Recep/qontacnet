"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Role = "uye" | "firma" | "admin";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  data: Record<string, unknown>;
}

interface RegisterData {
  ad: string;
  soyad?: string;
  email: string;
  password: string;
  role: "uye" | "firma";
  firmaAdi?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUserData: (data: Record<string, unknown>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = await res.json();
      setUser(json.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string, role: Role): Promise<boolean> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) return false;
    await refresh();
    return true;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return false;
    await refresh();
    return true;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const updateUserData = (data: Record<string, unknown>) => {
    setUser(prev => (prev ? { ...prev, data: { ...prev.data, ...data } } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
