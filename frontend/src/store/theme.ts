import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggle: () => void;
  hydrate: () => void;
}

const apply = (t: "light" | "dark") => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
};

export const useTheme = create<ThemeState>((set, get) => ({
  theme: "light",
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") localStorage.setItem("alaya_theme", next);
    apply(next);
    set({ theme: next });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("alaya_theme") as "light" | "dark" | null) ?? "light";
    apply(saved);
    set({ theme: saved });
  },
}));
