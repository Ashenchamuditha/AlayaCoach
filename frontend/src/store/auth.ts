import { create } from "zustand";

export type Role = "CLIENT" | "COACH";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("alaya_token", token);
      localStorage.setItem("alaya_user", JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("alaya_token");
      localStorage.removeItem("alaya_user");
    }
    set({ user: null, token: null });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("alaya_token");
    const userRaw = localStorage.getItem("alaya_user");
    if (token && userRaw) {
      try {
        set({ token, user: JSON.parse(userRaw) });
      } catch {
        // ignore
      }
    }
  },
}));
