import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { useAuth, type Role } from "@/store/auth";
import axios from "axios";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Alaya Master Coach" },
      { name: "description", content: "Start your free trial of Alaya Master Coach." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, hydrate } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP" | "DETAILS">("EMAIL");
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

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/request-otp", { email });
      setStep("OTP");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to send OTP");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      setStep("DETAILS");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid or expired OTP");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{
        token: string;
        user: { id: string; name: string; email: string; role: Role };
      }>("/auth/register", { fullName: name, email, password, role });
      setAuth(data.user, data.token);
      navigate({ to: data.user.role === "COACH" ? "/coach" : "/app" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
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
            <h1 className="text-xl md:text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">Join Alaya Master Coach today.</p>

            {step === "EMAIL" && (
              <form onSubmit={sendOtp} className="mt-5 md:mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-brand text-white hover:opacity-90"
                >
                  {loading ? "Sending code..." : "Send verification code"}
                </Button>
              </form>
            )}

            {step === "OTP" && (
              <form onSubmit={verifyOtp} className="mt-5 md:mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-[10px] text-muted-foreground text-center">
                    We sent a code to <span className="font-medium">{email}</span>
                  </p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-brand text-white hover:opacity-90"
                >
                  {loading ? "Verifying..." : "Verify email"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition"
                >
                  Use a different email
                </button>
              </form>
            )}

            {step === "DETAILS" && (
              <form onSubmit={submit} className="mt-5 md:mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["CLIENT", "COACH"] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          role === r
                            ? "border-primary bg-gradient-soft text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {r === "CLIENT" ? "Client" : "Coach"}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-brand text-white hover:opacity-90"
                >
                  {loading ? "Creating account..." : "Complete registration"}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <div className="mt-4 border-t border-border/40 pt-4 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition">
                ← Back to Home
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
