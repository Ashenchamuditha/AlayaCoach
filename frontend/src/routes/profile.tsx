import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Lock, 
  ChevronLeft, 
  Save, 
  Scale, 
  Target, 
  Activity, 
  Calendar,
  UserCircle,
  Eye,
  EyeOff,
  Mail,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { useAuth, type Role } from "@/store/auth";
import { toast } from "sonner";
import axios from "axios";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, setAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Basic Info
  const [name, setName] = useState("");
  
  // Profile Data (Client Only)
  const [gender, setGender] = useState("MALE");
  const [birthDate, setBirthDate] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState("SEDENTARY");
  const [primaryGoal, setPrimaryGoal] = useState("Weight Loss");
  
  // Password Update
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/profile");
      setName(data.fullName || "");
      setGender(data.gender || "MALE");
      setBirthDate(data.birthDate || "");
      setCurrentWeight(data.currentWeight?.toString() || "");
      setTargetWeight(data.targetWeight?.toString() || "");
      setHeightCm(data.heightCm?.toString() || "");
      setActivityLevel(data.activityLevel || "SEDENTARY");
      setPrimaryGoal(data.primaryGoal || "Weight Loss");
    } catch (err) {
      toast.error("Failed to load profile details");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: name,
        gender: user?.role === "CLIENT" ? gender : undefined,
        birthDate: user?.role === "CLIENT" ? birthDate : undefined,
        currentWeight: user?.role === "CLIENT" ? parseFloat(currentWeight) : undefined,
        targetWeight: user?.role === "CLIENT" ? parseFloat(targetWeight) : undefined,
        heightCm: user?.role === "CLIENT" ? parseFloat(heightCm) : undefined,
        activityLevel: user?.role === "CLIENT" ? activityLevel : undefined,
        primaryGoal: user?.role === "CLIENT" ? primaryGoal : undefined,
        newPassword: newPassword || undefined,
        confirmPassword: confirmPassword || undefined,
      };

      const { data } = await api.put("/users/profile", payload);
      
      // Update local auth store if name changed
      if (user) {
        setAuth({ ...user, name: data.fullName }, localStorage.getItem("alaya_token") || "");
      }
      
      toast.success("Profile updated successfully");
      setNewPassword("");
      setConfirmPassword("");
      
      // Auto refresh the page after a short delay to ensure everything is in sync
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#050505]">
      <SiteHeader />
      
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account information and preferences.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: user?.role === "COACH" ? "/coach" : "/app" })} className="hidden md:flex gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Account Card */}
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <div className="bg-gradient-brand h-24 relative">
                <div className="absolute -bottom-10 left-6">
                  <div className="h-20 w-20 rounded-2xl bg-white dark:bg-[#0a0a0b] p-1 shadow-lg border border-border/50">
                    <div className="h-full w-full rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                      <UserCircle className="h-10 w-10" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-14 p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" value={user?.email} disabled className="pl-10 bg-muted/30" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="pl-10"
                        placeholder="Your Name"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Password Section */}
            <Card className="p-6 space-y-4 border-border/50 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Security</h2>
                  <p className="text-xs text-muted-foreground">Update your password to keep your account secure.</p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {newPassword && (
                <p className="text-[10px] text-muted-foreground">
                  Leave blank if you don't want to change your password. Must be at least 6 characters.
                </p>
              )}
            </Card>

            {/* Client Biometrics Section */}
            {user?.role === "CLIENT" && (
              <Card className="p-6 space-y-6 border-border/50 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold">Health & Goals</h2>
                    <p className="text-xs text-muted-foreground">Keep your metrics up to date for better AI coaching.</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {/* Row 1: Gender & BirthDate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                         Gender
                      </Label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Private</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Birth Date
                      </Label>
                      <Input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2: Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3" /> Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" /> Target (kg)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        placeholder="65"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        Height (cm)
                      </Label>
                      <Input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="175"
                      />
                    </div>
                  </div>

                  {/* Row 3: Lifestyle */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Activity Level</Label>
                      <select
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="SEDENTARY">Sedentary (Office job)</option>
                        <option value="LIGHTLY_ACTIVE">Lightly Active (1-2 days/week)</option>
                        <option value="MODERATELY_ACTIVE">Moderately Active (3-5 days/week)</option>
                        <option value="VERY_ACTIVE">Very Active (Daily exercise)</option>
                        <option value="EXTRA_ACTIVE">Extra Active (Athlete)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Primary Goal</Label>
                      <select
                        value={primaryGoal}
                        onChange={(e) => setPrimaryGoal(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Improve Health">Improve General Health</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-brand text-white shadow-glow hover:opacity-90 h-11"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: user?.role === "COACH" ? "/coach" : "/app" })}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Mobile Back Button */}
          <div className="md:hidden pt-8 pb-4">
            <Button 
               variant="ghost" 
               className="w-full text-muted-foreground"
               onClick={() => navigate({ to: user?.role === "COACH" ? "/coach" : "/app" })}
            >
               <ChevronLeft className="h-4 w-4 mr-2" />
               Return to Home
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
