import { Link, useRouterState, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Moon,
  Sun,
  Sparkles,
  LayoutDashboard,
  Utensils,
  Bot,
  MessageSquare,
  LogOut,
  Menu,
  ChevronDown,
  User,
  UserCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useTheme } from "@/store/theme";
import { useAuth } from "@/store/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  // Safe search param access
  let activeTab = "overview";
  try {
    const searchParams: any = useSearch({ strict: false });
    if (searchParams?.tab) activeTab = searchParams.tab;
  } catch (e) {
    // router context might not be ready
  }

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    // Clear prompt when switching tabs normally
    if (path !== "/app") {
      navigate({ to: "/app", search: { tab: value } as any });
    } else {
      navigate({ to: "/app", search: { tab: value } as any });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/90 backdrop-blur-xl dark:bg-[#0a0a0b]/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-3 md:px-4">
        {/* Left Section: Logo & Mobile Dropdown */}
        <div className="flex items-center gap-1 md:gap-1.5">
          <button
            onClick={() => handleNavClick("overview")}
            className="flex items-center gap-2 shrink-0 transition-transform active:scale-95"
          >
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg md:rounded-xl bg-gradient-brand shadow-glow">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <span className="text-base md:text-lg font-bold tracking-tight hidden sm:inline">
              Alaya<span className="hidden lg:inline"> Master Coach</span>
            </span>
          </button>

          {/* Mobile Dropdown Menu on Left */}
          {user && user.role !== "COACH" && path === "/app" && (
            <div className="md:hidden flex items-center gap-0.5 ml-1">
              <div className="h-4 w-px bg-border/60 mx-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">Guide</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 mt-2 dark:bg-[#0a0a0b] border-border/50"
                >
                  {navItems.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => handleNavClick(item.value)}
                      className="flex items-center gap-3 h-11 cursor-pointer"
                    >
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{item.label}</span>
                      {activeTab === item.value && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
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

        {/* Right Section: Theme, Notifications & Auth */}
        <div className="flex items-center gap-0.5 md:gap-2">
          {user && <NotificationCenter />}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-0.5 md:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden border border-border/50"
                  >
                    <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-white">
                      <UserCircle className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2 dark:bg-[#0a0a0b] border-border/50"
                >
                  <div className="flex flex-col px-2 py-2 border-b border-border/50">
                    <span className="text-sm font-bold truncate">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {user.role}
                    </span>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer h-10">
                    <Link to="/profile" className="flex items-center gap-2 w-full">
                      <User className="h-4 w-4 text-primary" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowLogoutConfirm(true)}
                    className="cursor-pointer h-10 text-red-500 focus:text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : path !== "/login" && path !== "/register" ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
              >
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="dark:bg-[#0a0a0b] border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of Alaya Master Coach?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
