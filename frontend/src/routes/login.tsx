import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { useAuth, type Role } from "@/store/auth";
import axios from "axios";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Alaya Master Coach" },
      { name: "description", content: "Sign in to your Alaya account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, hydrate } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuth((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) {
      navigate({ to: user.role === "COACH" ? "/coach" : "/app" });
    }
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{
        token: string;
        user: { id: string; name: string; email: string; role: Role };
      }>("/auth/login", { email, password });
      setAuth(data.user, data.token);
      navigate({ to: data.user.role === "COACH" ? "/coach" : "/app" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid email or password");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 md:p-8 shadow-glow">
            <h1 className="text-xl md:text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">Sign in to continue your journey.</p>
            <form onSubmit={submit} className="mt-5 md:mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-brand text-white hover:opacity-90"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
            <div className="mt-4 border-t border-border/40 pt-4 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition">
                ← Back to Home
              </Link>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tip: include "coach" in email to log in as coach (demo).
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

