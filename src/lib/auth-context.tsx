"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Member, Firma, mockMembers, mockFirma } from "./mock-data";

export type Role = "uye" | "firma" | "admin";

export interface AdminUser {
  id: string;
  ad: string;
  email: string;
  rol: "Süper Admin" | "Operasyon" | "Destek";
}

interface AuthUser {
  id: string;
  role: Role;
  email: string;
  data: Member | Firma | AdminUser;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  ad: string;
  soyad?: string;
  email: string;
  password: string;
  role: "uye" | "firma";
  firmaAdi?: string;
}

const mockAdmin: AdminUser = {
  id: "admin-001",
  ad: "QONTAC Operasyon",
  email: "admin@qontac.net",
  rol: "Süper Admin",
};

const AuthContext = createContext<AuthContextType | null>(null);

const UYE_CREDENTIALS = [
  { email: "mehmet@technet.com.tr", password: "123456", id: "uye-001" },
  { email: "zeynep@technet.com.tr", password: "123456", id: "uye-002" },
  { email: "ali@technet.com.tr", password: "123456", id: "uye-003" },
  { email: "demo@qontac.net", password: "123456", id: "uye-001" },
];

const FIRMA_CREDENTIALS = [
  { email: "admin@technet.com.tr", password: "123456", id: "firma-001" },
  { email: "firma@qontac.net", password: "123456", id: "firma-001" },
];

const ADMIN_CREDENTIALS = [
  { email: "admin@qontac.net", password: "qontac123", id: "admin-001" },
  { email: "superadmin@qontac.net", password: "123456", id: "admin-001" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("qontac_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: Role): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 600));

    if (role === "uye") {
      const cred = UYE_CREDENTIALS.find(c => c.email === email && c.password === password);
      if (!cred) return false;
      const member = mockMembers.find(m => m.id === cred.id) ?? mockMembers[0];
      const authUser: AuthUser = { id: cred.id, role: "uye", email, data: member };
      setUser(authUser);
      localStorage.setItem("qontac_user", JSON.stringify(authUser));
      return true;
    } else if (role === "firma") {
      const cred = FIRMA_CREDENTIALS.find(c => c.email === email && c.password === password);
      if (!cred) return false;
      const authUser: AuthUser = { id: cred.id, role: "firma", email, data: mockFirma };
      setUser(authUser);
      localStorage.setItem("qontac_user", JSON.stringify(authUser));
      return true;
    } else {
      const cred = ADMIN_CREDENTIALS.find(c => c.email === email && c.password === password);
      if (!cred) return false;
      const authUser: AuthUser = { id: cred.id, role: "admin", email, data: mockAdmin };
      setUser(authUser);
      localStorage.setItem("qontac_user", JSON.stringify(authUser));
      return true;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 800));
    // Mock: always succeed, login as first member/firma
    if (data.role === "uye") {
      const member = mockMembers[0];
      const authUser: AuthUser = { id: member.id, role: "uye", email: data.email, data: member };
      setUser(authUser);
      localStorage.setItem("qontac_user", JSON.stringify(authUser));
    } else {
      const authUser: AuthUser = { id: mockFirma.id, role: "firma", email: data.email, data: mockFirma };
      setUser(authUser);
      localStorage.setItem("qontac_user", JSON.stringify(authUser));
    }
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("qontac_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
