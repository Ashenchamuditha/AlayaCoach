import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Sparkles,
  Target,
  Flame,
  Eye,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Utensils,
  ChevronRight,
  Users,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { AIAssistant } from "@/components/AIAssistant";
import { StopwatchTimer } from "@/components/StopwatchTimer";
import { AddGoalDialog, type NewGoalInput } from "@/components/AddGoalDialog";
import { AddFoodDialog } from "@/components/AddFoodDialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getMediaUrl } from "@/lib/api";
import { createChatClient } from "@/lib/ws";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || "overview",
      prompt: (search.prompt as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Dashboard — Alaya Master Coach ✨" },
      { name: "description", content: "Your daily check-ins and AI coaching." },
    ],
  }),
  component: ClientDashboard,
});

interface Goal {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  category?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  targetValue?: number;
  targetUnit?: string;
  createdAt?: string;
  updatedAt?: string;
  coachFeedback?: string;
  createdByCoach?: boolean;
  coachViewed?: boolean;
  deletedByClient?: boolean;
}

interface FoodEntry {
  id: number;
  foodName: string;
  portion?: string;
  calories: number;
  entryTime: string;
  updatedAt?: string;
  aiFeedback?: string;
  classification?: string;
  chatStarter?: string;
  coachFeedback?: string;
  imageUrl?: string;
}

interface WeeklyReport {
  id: number;
  startDate: string;
  endDate: string;
  clientSummary: string;
  coachBrief: string;
  createdAt: string;
}

interface DashboardData {
  goals: Goal[];
  aiFeedback: string;
  recentCheckins: {
    id: string;
    note: string;
    checkinTime: string;
    aiFeedback?: string;
  }[];
  weekly: { day: string; score: number }[];
  coachId: string;
  coachName: string;
  lastMessage?: string;
  unreadCount?: number;
}

function GoalPreviewDialog({
  goal,
  onClose,
  onToggle,
}: {
  goal: Goal | null;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  if (!goal) return null;

  return (
    <Dialog open={!!goal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{goal.title}</DialogTitle>
            <Badge
              variant={goal.done ? "secondary" : "default"}
              className={
                goal.done
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
              }
            >
              {goal.done ? "Completed" : "Still Active"}
            </Badge>
          </div>
          <DialogDescription className="pt-2 text-foreground/80">
            {goal.description || "No description provided."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">Priority</p>
              <Badge variant={goal.priority === "high" ? "destructive" : "default"}>
                {goal.priority}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase">Category</p>
              <Badge variant="outline">{goal.category}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Due Date</p>
                <p className="text-sm font-medium">{goal.dueDate?.split("T")[0] || "No date"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Time & Duration</p>
                <p className="text-sm font-medium">
                  {goal.startTime || "N/A"} - {goal.endTime || "N/A"}
                </p>
                {goal.durationMinutes && (
                  <p className="text-xs text-muted-foreground">{goal.durationMinutes} minutes</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Target</p>
            <p className="text-lg font-bold text-gradient-brand">
              {goal.targetValue ?? 0}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {goal.targetUnit || ""}
              </span>
            </p>
          </div>

          {goal.coachFeedback && (
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Coach Feedback
                </p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {goal.coachFeedback}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {goal.done ? (
            <Button
              className="w-full sm:flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
              variant="outline"
              onClick={() => {
                onToggle(goal.id);
                onClose();
              }}
            >
              Mark as Still Active
            </Button>
          ) : (
            <Button
              className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                onToggle(goal.id);
                onClose();
              }}
            >
              Mark as Completed
            </Button>
          )}
          <Button onClick={onClose} variant="ghost" className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DailyTip {
  id: number;
  content: string;
}

function ClientDashboard() {
  const { user, hydrate, token } = useAuth();
  const navigate = useNavigate();
  const { tab: activeTab, prompt } = Route.useSearch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewGoal, setPreviewGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<number | null>(null);
  const [isRefreshingTips, setIsRefreshingTips] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (dailyTips.length <= 1) return;
    console.log("Setting up Daily Insights auto-scroll");
    
    const scrollInterval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        // If reached the end (with a 20px buffer), scroll back to start
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(scrollInterval);
  }, [dailyTips]);

  const fetchDashboard = () => {
    api
      .get<DashboardData>("/dashboard/client")
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error("Dashboard fetch failed:", err);
        setError("Failed to load dashboard data. Please check your connection.");
      });
  };

  const fetchFoodEntries = () => {
    api
      .get<FoodEntry[]>("/food")
      .then((r) => setFoodEntries(r.data))
      .catch((err) => console.error("Food entries fetch failed:", err));
  };

  const fetchDailyTips = () => {
    api
      .get<DailyTip[]>("/tips/daily")
      .then((r) => setDailyTips(r.data))
      .catch((err) => console.error("Daily tips fetch failed:", err));
  };

  const fetchWeeklyReport = () => {
    api
      .get<WeeklyReport>("/reports/latest")
      .then((r) => setWeeklyReport(r.data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          console.error("Weekly report fetch failed:", err);
        }
      });
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { data } = await api.post<WeeklyReport>("/reports/generate");
      setWeeklyReport(data);
      toast.success("New weekly report generated!");
    } catch (err) {
      console.error("Report generation failed:", err);
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadPDF = async () => {
    if (!weeklyReport || !user) return;
    try {
      toast.info("Generating PDF...");
      
      const pdf = new jsPDF("p", "mm", "a4");
      const margin = 20;
      let cursorY = margin;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const textWidth = pageWidth - margin * 2;

      // Header
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(99, 102, 241); // Indigo-500
      pdf.text("Alaya Master Coach", margin, cursorY);
      cursorY += 10;

      // Subheader
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Weekly AI Progress Report", margin, cursorY);
      cursorY += 8;

      // Meta info
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Client: ${user.name}`, margin, cursorY);
      cursorY += 5;
      pdf.text(`Period: ${new Date(weeklyReport.startDate).toLocaleDateString()} - ${new Date(weeklyReport.endDate).toLocaleDateString()}`, margin, cursorY);
      cursorY += 15;

      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, cursorY - 5, pageWidth - margin, cursorY - 5);

      // Report Content Title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(40, 40, 40);
      pdf.text("Your Progress Summary", margin, cursorY);
      cursorY += 8;

      // Report Content Body
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      
      // Split text to fit width
      const splitText = pdf.splitTextToSize(weeklyReport.clientSummary, textWidth);
      
      // Add text with page break handling
      for (let i = 0; i < splitText.length; i++) {
        if (cursorY > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(splitText[i], margin, cursorY);
        cursorY += 6;
      }

      // Footer
      cursorY += 15;
      if (cursorY > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Generated by Alaya Master Coach AI", pageWidth / 2, cursorY, { align: "center" });

      pdf.save(`Alaya_Weekly_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const refreshTips = async () => {
    setIsRefreshingTips(true);
    try {
      const { data } = await api.post<DailyTip[]>("/tips/refresh");
      setDailyTips(data);
      toast.success("AI generated new tips for you!");
    } catch (err) {
      toast.error("Failed to refresh tips");
    } finally {
      setIsRefreshingTips(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!useAuth.getState().user) navigate({ to: "/login", replace: true });
    }, 50);
    return () => clearTimeout(t);
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
    fetchFoodEntries();
    fetchDailyTips();
    fetchWeeklyReport();
  }, []);

  useEffect(() => {
    if (!token) return;
    const ws = createChatClient(
      token,
      (msg) => {
        fetchDashboard();
      },
      (update) => {
        if (
          update.type === "GOAL_UPDATE" ||
          update.type === "GOAL_DELETED" ||
          update.type === "FOOD_FEEDBACK" ||
          update.type === "NEW_NOTIFICATION"
        ) {
          fetchDashboard();
          if (update.type === "FOOD_FEEDBACK") {
            fetchFoodEntries();
            toast.success("Coach sent feedback on your food log!");
          }
        }
      },
    );
    ws.activate();
    return () => {
      ws.deactivate();
    };
  }, [token]);

  if (!user) return null;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-destructive">Error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  const completedCount = (data.goals || []).filter((g) => g.done).length;

  const toggle = async (id: string) => {
    if (togglingIds.has(id)) return;
    
    const goal = data.goals.find((g) => g.id === id);
    if (!goal) return;
    const nextStatus = !goal.done;

    // 1. Lock the button
    setTogglingIds((prev) => new Set(prev).add(id));

    // 2. Optimistic update
    setData((d) => {
      if (!d) return null;
      return {
        ...d,
        goals: d.goals.map((g) => (g.id === id ? { ...g, done: nextStatus } : g)),
      };
    });

    if (nextStatus) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    try {
      // 3. Send update
      const { data: updatedGoal } = await api.patch(`/goals/${id}/toggle?completed=${nextStatus}`);
      
      // 4. Update with actual server data
      setData((d) => {
        if (!d) return null;
        return {
          ...d,
          goals: d.goals.map((g) => (g.id === id ? { ...g, done: updatedGoal.status === "COMPLETED" } : g)),
        };
      });
      
      // 5. Trigger a dashboard refresh for other stats
      fetchDashboard();
    } catch (err) {
      console.error("Toggle failed:", err);
      toast.error("Failed to update status");
      // Revert optimistic update
      setData((d) => {
        if (!d) return null;
        return {
          ...d,
          goals: d.goals.map((g) => (g.id === id ? { ...g, done: !nextStatus } : g)),
        };
      });
    } finally {
      // 6. Unlock the button
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await api.delete(`/goals/${goalToDelete}`);
      setData((d) => (d ? { ...d, goals: d.goals.filter((g) => g.id !== goalToDelete) } : null));
      toast.success("Goal deleted");
      fetchDashboard();
    } catch {
      toast.error("Failed to delete goal");
    } finally {
      setGoalToDelete(null);
    }
  };

  const confirmDeleteFood = async () => {
    if (foodToDelete === null) return;
    try {
      await api.delete(`/food/delete/${foodToDelete}`);
      setFoodEntries((prev) => prev.filter((f) => f.id !== foodToDelete));
      toast.success("Food log deleted");
      fetchDashboard();
      fetchFoodEntries();
    } catch (err) {
      console.error("Failed to delete food log:", err);
      toast.error("Failed to delete food log");
    } finally {
      setFoodToDelete(null);
    }
  };

  const addGoal = (g: NewGoalInput & { id: string }) => {
    fetchDashboard();
    setData((d) => {
      if (!d) return null;
      return {
        ...d,
        goals: [
          {
            id: g.id,
            title: g.title,
            description: g.description,
            done: false,
            category: g.category,
            priority: g.priority,
            dueDate: g.dueDate,
            startTime: g.startTime,
            endTime: g.endTime,
            durationMinutes: g.durationMinutes,
            targetValue: g.targetValue,
            targetUnit: g.targetUnit,
            createdAt: new Date().toISOString(),
          },
          ...(d.goals || []),
        ],
      };
    });
  };

  const todayCalories = (foodEntries || [])
    .filter(
      (e) => e.entryTime && new Date(e.entryTime).toDateString() === new Date().toDateString(),
    )
    .reduce((acc, e) => acc + (e.calories || 0), 0);

  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      <SiteHeader />
      <main className="container mx-auto flex-1 flex flex-col px-4 py-4 md:py-8">
        <div className="grid gap-6 flex-1">
          {/* Greeting Card - Only show on Overview (and Nutrition on Desktop) */}
          {((activeTab === "overview") || (activeTab === "nutrition" && !isMobile)) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(activeTab === "nutrition" && "hidden md:block")}>
              <Card className="relative overflow-hidden bg-gradient-brand p-5 md:p-8 text-white shadow-glow border-none">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">Hi, {user.name.split(" ")[0]}!</h1>
                    <p className="mt-1 md:mt-2 text-white/80 max-w-md text-xs md:text-base">
                      You've completed {completedCount} goals today. Keep up the momentum!
                    </p>
                  </div>
                  <div className="flex gap-2 md:gap-4">
                    <div className="flex-1 md:flex-none rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md p-2.5 md:p-4 text-center min-w-[64px] md:min-w-[96px]">
                      <p className="text-lg md:text-3xl font-bold">{completedCount}</p>
                      <p className="text-[7px] md:text-[10px] uppercase font-bold text-white/60">Done</p>
                    </div>
                    <div className="flex-1 md:flex-none rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md p-2.5 md:p-4 text-center min-w-[64px] md:min-w-[96px]">
                      <p className="text-lg md:text-3xl font-bold">{(data.goals || []).length}</p>
                      <p className="text-[7px] md:text-[10px] uppercase font-bold text-white/60">Total</p>
                    </div>
                  </div>
                </div>
                <Sparkles className="absolute -bottom-6 -right-6 h-20 w-20 md:h-32 md:w-32 text-white/10" />
              </Card>
            </motion.div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                <Card className="p-3 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <Clock className="h-3.5 w-3.5 md:h-5 md:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] md:text-xs text-muted-foreground uppercase font-bold">Recent</p>
                      <p className="text-[10px] md:text-sm font-bold truncate">
                        {data.recentCheckins && data.recentCheckins.length > 0
                          ? data.recentCheckins[0].note
                          : "No actions yet"}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <Target className="h-3.5 w-3.5 md:h-5 md:w-5" />
                    </div>
                    <div>
                      <p className="text-[8px] md:text-xs text-muted-foreground uppercase font-bold">Goals</p>
                      <p className="text-lg md:text-2xl font-bold leading-none">
                        {completedCount}/{(data.goals || []).length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card
                  className="p-3 md:p-6 cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => navigate({ to: "/app", search: { tab: "nutrition" } })}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Flame className="h-3.5 w-3.5 md:h-5 md:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] md:text-xs text-muted-foreground uppercase font-bold">Calories</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg md:text-2xl font-bold leading-none">
                          {todayCalories}
                          <span className="ml-0.5 text-[8px] md:text-sm font-normal text-muted-foreground">kcal</span>
                        </p>
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="relative p-3 md:p-6">
                  {!!data.unreadCount && data.unreadCount > 0 && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-full bg-destructive text-[7px] md:text-[10px] font-bold text-white shadow-lg animate-pulse">
                      {data.unreadCount > 9 ? "9+" : data.unreadCount}
                    </div>
                  )}
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <Sparkles className="h-3.5 w-3.5 md:h-5 md:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] md:text-xs text-muted-foreground uppercase font-bold">Coach</p>
                      <p className="text-[10px] md:text-sm font-medium line-clamp-1">
                        {data.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Card id="weekly-report-content" className="p-4 md:p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Weekly AI Summary</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {weeklyReport && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadPDF}
                            className="text-xs bg-white/50 dark:bg-black/50"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateReport}
                          disabled={isGeneratingReport}
                          className="text-xs bg-white/50 dark:bg-black/50"
                        >
                          {isGeneratingReport ? "Analyzing..." : (weeklyReport ? "Refresh" : "Generate Report")}
                        </Button>
                      </div>
                    </div>
                    {weeklyReport ? (
                      <div className="space-y-3">
                        <p className="text-sm md:text-base leading-relaxed text-foreground/90 font-medium">
                          {weeklyReport.clientSummary}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-right">
                          Report for: {new Date(weeklyReport.startDate).toLocaleDateString()} - {new Date(weeklyReport.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-2">
                        Click "Generate Report" to get a personalized AI summary of your progress this week.
                      </p>
                    )}
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">Today's goals</h2>
                        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                          Check them off as you go.
                        </p>
                      </div>
                      <AddGoalDialog onAdd={addGoal} />
                    </div>
                  <ul className="mt-4 space-y-3">
                    <AnimatePresence>
                      {(data.goals || []).map((g) => (
                        <motion.li
                          key={g.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={cn(
                            "flex items-start justify-between gap-3 rounded-xl border border-border p-3 md:p-4 transition hover:bg-muted/50 shadow-sm",
                            g.createdByCoach && "bg-amber-50/30 border-amber-100"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`text-sm md:text-base font-semibold leading-tight break-words ${g.done ? "text-muted-foreground line-through" : ""}`}
                              >
                                {g.title}
                              </p>
                              {g.createdByCoach && (
                                <Badge variant="outline" className="text-[7px] h-3.5 bg-amber-100 text-amber-700 border-amber-200 uppercase font-black tracking-tighter shrink-0">
                                  Coach
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[8px] md:text-[9px] h-4 py-0 px-1.5 shrink-0">
                                {g.category}
                              </Badge>
                              <Badge
                                variant={g.priority === "high" ? "destructive" : "secondary"}
                                className="text-[8px] md:text-[9px] h-4 py-0 px-1.5 shrink-0"
                              >
                                {g.priority}
                              </Badge>
                              {g.createdAt && (
                                <span className="text-[8px] md:text-[9px] text-muted-foreground bg-muted/30 px-1.5 rounded flex items-center gap-1 shrink-0">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 md:gap-2 shrink-0 self-center">
                            {g.done ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 md:h-9 md:w-auto text-[10px] p-0 md:px-3 text-amber-600 border-amber-200 rounded-full md:rounded-lg flex items-center justify-center shrink-0"
                                onClick={() => toggle(g.id)}
                                disabled={togglingIds.has(g.id)}
                                title="Re-activate"
                              >
                                <span className="hidden md:inline font-bold">{togglingIds.has(g.id) ? "Wait..." : "Re-activate"}</span>
                                <RefreshCw className={cn("h-4 w-4 md:hidden", togglingIds.has(g.id) && "animate-spin")} />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 w-8 md:h-9 md:w-auto text-[10px] p-0 md:px-3 bg-green-600 hover:bg-green-700 text-white rounded-full md:rounded-lg flex items-center justify-center shrink-0"
                                onClick={() => toggle(g.id)}
                                disabled={togglingIds.has(g.id)}
                                title="Complete"
                              >
                                <span className="hidden md:inline font-bold">{togglingIds.has(g.id) ? "Wait..." : "Complete"}</span>
                                <CheckCircle2 className="h-4 w-4 md:hidden" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 md:h-9 md:w-9 text-primary shrink-0 rounded-full md:rounded-lg hover:bg-primary/5"
                              onClick={() => setPreviewGoal(g)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 md:h-9 md:w-9 text-destructive shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity rounded-full md:rounded-lg hover:bg-destructive/5"
                              onClick={() => setGoalToDelete(g.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                    {(!data.goals || data.goals.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Target className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-xs font-semibold">No goals yet</h3>
                      </div>
                    )}
                  </ul>
                </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Weekly</h2>
                      <Flame className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="mt-4 h-40 md:h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.weekly || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} dy={10} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 10 }} />
                          <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <StopwatchTimer />
                </div>
              </div>
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="space-y-4 md:space-y-6">
              {/* Daily Summary Card - Compact on Mobile */}
              <Card className="overflow-hidden border-none rounded-2xl md:rounded-3xl bg-gradient-brand text-white shadow-lg">
                <div className="p-4 md:p-8">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-xs font-bold uppercase tracking-wider opacity-80">Today's Intake</p>
                      <h2 className="text-2xl md:text-4xl font-extrabold mt-0.5 truncate">
                        {todayCalories}
                        <span className="ml-1 text-xs md:text-lg font-medium opacity-80">kcal</span>
                      </h2>
                    </div>
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                      <Flame className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">
                      <span>Progress</span>
                      <span>{Math.round((todayCalories / 2500) * 100)}%</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((todayCalories / 2500) * 100, 100)}%` }}
                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Mobile AI Insights - Horizontal Swipe to save vertical space & view full content */}
              <div className="lg:hidden space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">Daily AI Insights</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn("h-7 px-2.5 text-[10px] font-bold text-primary bg-primary/5 rounded-full border-primary/20", isRefreshingTips && "opacity-50 cursor-not-allowed")}
                    onClick={refreshTips}
                    disabled={isRefreshingTips}
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1.5", isRefreshingTips && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
                <div ref={carouselRef} className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar snap-x touch-pan-x">
                  {dailyTips.length > 0 ? (
                    dailyTips.map((tip) => (
                      <div key={tip.id} className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 min-w-[88%] snap-center shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium leading-relaxed text-foreground/90">{tip.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-6 text-center border rounded-xl border-dashed">
                      <p className="text-[10px] text-muted-foreground italic">AI is crafting your tips...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold tracking-tight px-1">Food Log</h2>
                  <AddFoodDialog onAdd={(entry: any) => setFoodEntries([entry as FoodEntry, ...(foodEntries || [])])} />
                </div>

                <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 w-full space-y-3 md:space-y-4">
                    <AnimatePresence>
                      {(foodEntries || []).map((entry) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative rounded-xl md:rounded-2xl border border-border/40 bg-card p-3 md:p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 relative">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-7 w-7 md:h-8 md:w-8 text-destructive bg-background/80 backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 rounded-full border border-border/50 shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFoodToDelete(entry.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                            
                            <div className="flex gap-3 md:gap-4 items-start">
                              {entry.imageUrl ? (
                                <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg md:rounded-xl overflow-hidden border border-border/50 shrink-0 shadow-sm">
                                  <img src={getMediaUrl(entry.imageUrl)} alt={entry.foodName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                </div>
                              ) : (
                                <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg md:rounded-xl bg-muted/30 flex items-center justify-center shrink-0 border border-dashed">
                                  <Utensils className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/30" />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5">
                                <h3 className="font-bold text-base md:text-lg leading-tight break-words mb-1.5 pr-6">{entry.foodName}</h3>
                                <div className="flex flex-wrap gap-1.5 text-[10px] md:text-xs font-bold mb-2">
                                  <Badge variant="outline" className="text-[9px] md:text-[10px] font-bold bg-muted/50 border-none px-1.5 py-0.5 h-auto">
                                    {entry.entryTime ? new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"}
                                  </Badge>
                                  <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full shrink-0">
                                    <Flame className="h-2.5 w-2.5" /> {entry.calories || 0} kcal
                                  </span>
                                  <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                                    {entry.portion || "Normal"}
                                  </span>
                                </div>
                                {entry.classification && (
                                  <div className={cn(
                                    "w-fit px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold uppercase tracking-widest",
                                    entry.classification === "HEALTHY" 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-red-100 text-red-700"
                                  )}>
                                    {entry.classification === "HEALTHY" ? "Healthy" : "Limit"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {entry.aiFeedback && (
                            <div className="mt-2.5 relative rounded-lg md:rounded-xl bg-primary/[0.03] p-3 md:p-4 border border-primary/10">
                              <div className="absolute top-0 left-0 w-0.5 h-full bg-primary/20" />
                              <div className="flex gap-1 mb-1">
                                <Sparkles className="h-2 w-2 text-primary" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-primary/70">AI Analysis</span>
                              </div>
                              <p className="text-[11px] md:text-sm text-foreground/80 leading-relaxed italic break-words whitespace-pre-wrap w-full">
                                "{entry.aiFeedback}"
                              </p>
                              {entry.chatStarter && (
                                <div className="mt-2 flex justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-auto py-1 max-w-full text-[9px] md:text-[10px] text-primary hover:text-white hover:bg-primary font-bold gap-1 rounded-md border border-primary/20 px-2"
                                    onClick={() => navigate({ to: "/app", search: { tab: "ai", prompt: entry.chatStarter } as any })}
                                  >
                                    <span className="whitespace-normal text-left">Ask: {entry.chatStarter}</span>
                                    <ChevronRight className="h-3 w-3 shrink-0" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {entry.coachFeedback && (
                            <div className="mt-2 relative rounded-lg md:rounded-xl bg-amber-50/50 p-3 md:p-4 border border-amber-200/50">
                              <div className="absolute top-0 left-0 w-0.5 h-full bg-amber-400/40" />
                              <div className="flex gap-1 mb-1">
                                <Users className="h-2 w-2 text-amber-600" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-amber-700/70">Coach Feedback</span>
                              </div>
                              <p className="text-[11px] md:text-sm text-foreground/80 leading-relaxed font-medium break-words whitespace-pre-wrap w-full">
                                {entry.coachFeedback}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {(!foodEntries || foodEntries.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                        <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                          <Utensils className="h-5 w-5 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground">Log your first meal</h3>
                        <p className="text-[8px] text-muted-foreground/60 max-w-[130px] mt-1">Get AI insights on your nutrition goals.</p>
                      </div>
                    )}
                    </div>
                  </div>
                  
                  {/* Desktop AI Tips - Styled consistently */}
                  <div className="hidden lg:block space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Daily Insights</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 text-primary bg-primary/5 rounded-full", isRefreshingTips && "animate-spin")}
                        onClick={refreshTips}
                        disabled={isRefreshingTips}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {dailyTips.length > 0 ? (
                        dailyTips.map((tip) => (
                          <div key={tip.id} className="flex gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-xs font-medium leading-relaxed">{tip.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center border rounded-2xl border-dashed">
                          <p className="text-[10px] text-muted-foreground italic">AI is preparing your tips...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="-mx-4 md:mx-0 h-[calc(100dvh-130px)] md:h-[650px] flex flex-col">
              <AIAssistant initialPrompt={prompt} />
            </div>
          )}

          {activeTab === "chat" && (
            <div className="mx-auto max-w-4xl w-full -mx-4 md:mx-0 h-[calc(100dvh-130px)] md:h-[750px] flex flex-col">
              <ChatInterface peerId={data.coachId} peerName={data.coachName} />
            </div>
          )}
        </div>
      </main>

      <GoalPreviewDialog goal={previewGoal} onClose={() => setPreviewGoal(null)} onToggle={toggle} />
      <AlertDialog open={!!goalToDelete} onOpenChange={(o) => !o && setGoalToDelete(null)}>
        <AlertDialogContent className="dark:bg-[#0a0a0b] border-border/50">
          <AlertDialogHeader><AlertDialogTitle>Delete Goal?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!foodToDelete} onOpenChange={(o) => !o && setFoodToDelete(null)}>
        <AlertDialogContent className="dark:bg-[#0a0a0b] border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Log?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this food entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFood} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
