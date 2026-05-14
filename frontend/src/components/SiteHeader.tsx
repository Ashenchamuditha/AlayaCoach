import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/store/theme";
import { useAuth } from "@/store/auth";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Alaya</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              {user.role === "COACH" ? (
                <Link to="/coach" className={path === "/coach" ? "hidden" : ""}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/app" className={path === "/app" ? "hidden" : ""}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            path !== "/login" && path !== "/register" ? (
              <>
                <Button asChild variant="ghost"><Link to="/login">Login</Link></Button>
                <Button asChild className="bg-gradient-brand text-white hover:opacity-90">
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            ) : null
          )}
        </div>
      </div>
    </header>
  );
}
