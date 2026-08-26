import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User, Workspace } from "@/types";

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; workspaceName: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (id: string) => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const me = await api.get("/auth/me");
      setUser(me.data.user);
      const ws: Workspace[] = me.data.user.workspaceMembers.map((m: any) => ({
        ...m.workspace,
        role: m.role,
      }));
      setWorkspaces(ws);
      const savedWs = localStorage.getItem("workspace_id");
      const active = ws.find((w) => w.id === savedWs) || ws[0];
      if (active) {
        setWorkspace(active);
        localStorage.setItem("workspace_id", active.id);
      }
    } catch {
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("access_token");
      if (token) await fetchMe();
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.accessToken);
    localStorage.setItem("refresh_token", res.data.refreshToken);
    await fetchMe();
    setIsLoading(false);
  };

  const register = async (data: { name: string; email: string; password: string; workspaceName: string }) => {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("access_token", res.data.accessToken);
    localStorage.setItem("refresh_token", res.data.refreshToken);
    await fetchMe();
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (err) {
      // logout is best-effort; always clear local state
      void err;
    }
    localStorage.clear();
    setUser(null);
    setWorkspace(null);
    setWorkspaces([]);
  };

  const switchWorkspace = (id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) {
      setWorkspace(ws);
      localStorage.setItem("workspace_id", ws.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, workspace, workspaces, isLoading, login, register, logout, switchWorkspace, refreshMe: fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
