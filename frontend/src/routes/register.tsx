import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { OtpInput } from "@/components/OtpInput";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<Role>("CLIENT");
  const [otp, setOtp] = useState("");

  // Profile Data
  const [gender, setGender] = useState("MALE");
  const [birthDate, setBirthDate] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState("SEDENTARY");
  const [primaryGoal, setPrimaryGoal] = useState("Weight Loss");

  const [step, setStep] = useState<"EMAIL" | "OTP" | "DETAILS" | "BIOMETRICS">("EMAIL");
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

  useEffect(() => {
    if (otp.length === 6 && step === "OTP") {
      verifyOtp();
    }
  }, [otp]);

  const sendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/request-otp", { email });
      setStep("OTP");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to send OTP. Please check your SMTP settings.",
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length < 6) return;

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
      setOtp(""); // Clear OTP on failure to allow re-entry
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Final validation
    if (!birthDate) {
      setError("Please select your birth date");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // Safely parse numeric fields, defaulting to 0 or null if invalid
      const parsedCurrentWeight = parseFloat(currentWeight);
      const parsedTargetWeight = parseFloat(targetWeight);
      const parsedHeight = parseFloat(heightCm);

      const payload = {
        name,
        email,
        password,
        confirmPassword,
        role,
        gender,
        birthDate,
        currentWeight: isNaN(parsedCurrentWeight) ? null : parsedCurrentWeight,
        targetWeight: isNaN(parsedTargetWeight) ? null : parsedTargetWeight,
        heightCm: isNaN(parsedHeight) ? null : parsedHeight,
        activityLevel,
        primaryGoal,
      };

      const { data } = await api.post<{
        token: string;
        user: { id: string; name: string; email: string; role: Role };
      }>("/auth/register", payload);

      setAuth(data.user, data.token);
      navigate({ to: data.user.role === "COACH" ? "/coach" : "/app" });
    } catch (err: unknown) {
      console.error("Registration error details:", err);
      let errorMsg = "An unexpected error occurred";
      if (axios.isAxiosError(err)) {
        console.error("Axios error response:", err.response?.data);
        errorMsg =
          err.response?.data?.message || err.message || "Registration failed. Please try again.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 md:p-8 shadow-glow">
            <h1 className="text-xl md:text-2xl font-bold">
              {step === "DETAILS" && "Almost there"}
              {step === "BIOMETRICS" && "Personalize your experience"}
              {(step === "EMAIL" || step === "OTP") && "Create your account"}
            </h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">
              {step === "EMAIL" && "Enter your email to get started."}
              {step === "OTP" && "Enter the 6-digit code we sent to your email."}
              {step === "DETAILS" && "Let's set up your secure access."}
              {step === "BIOMETRICS" && "This helps our AI give you better advice."}
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
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}
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
              <form onSubmit={verifyOtp} className="mt-5 md:mt-6 space-y-6">
                <div className="space-y-4">
                  <Label className="block text-center text-sm font-medium">Verification Code</Label>
                  <OtpInput value={otp} onChange={setOtp} />
                  <p className="text-[10px] text-muted-foreground text-center">
                    We sent a code to <span className="font-semibold text-foreground">{email}</span>
                    . It expires in 5 minutes.
                  </p>
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-brand text-white hover:opacity-90"
                >
                  {loading ? "Verifying..." : "Verify email"}
                </Button>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading}
                    className="text-xs text-primary hover:underline transition font-medium"
                  >
                    Didn't get a code? Resend
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("EMAIL")}
                    className="text-xs text-muted-foreground hover:text-primary transition"
                  >
                    ← Use a different email
                  </button>
                </div>
              </form>
            )}

            {step === "DETAILS" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    return;
                  }
                  setError(null);
                  setStep("BIOMETRICS");
                }}
                className="mt-5 md:mt-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-brand text-white hover:opacity-90"
                >
                  Continue to profile
                </Button>
              </form>
            )}

            {step === "BIOMETRICS" && (
              <form onSubmit={submit} className="mt-5 md:mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Private</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      required
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">Target (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      required
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="65"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">Height (cm)</Label>
                    <Input
                      type="number"
                      required
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="175"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Activity Level</Label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="SEDENTARY">Sedentary (Office job)</option>
                    <option value="LIGHTLY_ACTIVE">Light (1-2 days/week)</option>
                    <option value="MODERATELY_ACTIVE">Moderate (3-5 days/week)</option>
                    <option value="VERY_ACTIVE">Very Active (Daily)</option>
                    <option value="EXTRA_ACTIVE">Extra Active (Athlete)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Primary Goal</Label>
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Improve Health">Improve General Health</option>
                  </select>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("DETAILS")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-brand text-white hover:opacity-90 shadow-glow"
                  >
                    {loading ? "Creating account..." : "Complete & Start"}
                  </Button>
                </div>
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
