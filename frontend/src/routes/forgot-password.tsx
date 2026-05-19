import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Alaya Master Coach" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"EMAIL" | "RESET">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep("RESET");
      toast.success("Reset code sent to your email");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to send reset code");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Password reset successfully! Please log in.");
      navigate({ to: "/login" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid code or reset failed");
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
            <h1 className="text-xl md:text-2xl font-bold">Reset Password</h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">
              {step === "EMAIL" 
                ? "Enter your email to receive a reset code." 
                : "Enter the code and your new password."}
            </p>

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
                  {loading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            )}

            {step === "RESET" && (
              <form onSubmit={resetPassword} className="mt-5 md:mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Reset Code</Label>
                  <Input
                    id="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="text-center tracking-widest"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-brand text-white hover:opacity-90"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition"
                >
                  ← Back to Email entry
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-border/40 pt-4 text-center">
              <Link to="/login" className="text-xs text-muted-foreground hover:text-primary transition">
                Return to Login
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
