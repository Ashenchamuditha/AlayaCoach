import { Link, useRouterState, useNavigate, useSearch } from "@tanstack/react-router";
import { Moon, Sun, Sparkles, LayoutDashboard, Utensils, Bot, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useTheme } from "@/store/theme";
import { useAuth } from "@/store/auth";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const searchParams: any = useSearch({ strict: false });
  const activeTab = searchParams?.tab || "overview";

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const navItems = [
    { label: "Overview", value: "overview", icon: LayoutDashboard },
    { label: "Nutrition", value: "nutrition", icon: Utensils },
    { label: "AI Assistant", value: "ai", icon: Bot },
    { label: "Chat with Coach", value: "chat", icon: MessageSquare },
  ];

  const handleNavClick = (value: string) => {
    if (path !== "/app") {
      navigate({ to: "/app", search: { tab: value } as any });
    } else {
      // If already on /app, we'll need a way to communicate the tab change.
      // For now, we'll assume the app component listens to search params or we'll update it.
      navigate({ to: "/app", search: (prev: any) => ({ ...prev, tab: value }) });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/90 backdrop-blur-xl dark:bg-[#0a0a0b]/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Alaya<span className="hidden sm:inline"> Master Coach</span>
            </span>
          </Link>
        </div>

        {/* Centered Navigation for Desktop */}
        {user && user.role !== "COACH" && path === "/app" && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <Button
                  key={item.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick(item.value)}
                  className={`relative flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground ${
                    isActive ? "text-foreground font-semibold" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Button>
              );
            })}
          </nav>
        )}

        {/* Right Section: Theme & Auth */}
        <div className="flex items-center gap-2">
          {user && <NotificationCenter />}
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex border-border/60 hover:bg-accent"
              >
                Logout
              </Button>
              {/* Profile/Initials Circle for Mobile */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-[10px] font-bold text-white sm:hidden">
                {user.name.split(" ").map(n => n[0]).join("")}
              </div>
            </div>
          ) : path !== "/login" && path !== "/register" ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Visible only on mobile when logged in and on /app */}
      {user && user.role !== "COACH" && path === "/app" && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/50 bg-white/95 p-2 backdrop-blur-lg dark:bg-[#0a0a0b]/95 pb-safe">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleNavClick(item.value)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
                <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
