import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || "overview",
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
  coachFeedback?: string;
}

interface FoodEntry {
  id: number;
  foodName: string;
  portion?: string;
  calories: number;
  entryTime: string;
  aiFeedback?: string;
  coachFeedback?: string;
  imageUrl?: string;
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

function ClientDashboard() {
  const { user, hydrate, token } = useAuth();
  const navigate = useNavigate();
  const { tab: activeTab } = Route.useSearch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewGoal, setPreviewGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

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
          update.type === "FOOD_FEEDBACK"
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
    const goal = data.goals.find((g) => g.id === id);
    if (!goal) return;
    const nextStatus = !goal.done;

    // Optimistic update
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
      await api.patch(`/goals/${id}/toggle?completed=${nextStatus}`);
      await api.post("/checkins", { goalId: id, completed: nextStatus });
      fetchDashboard();
    } catch {
      toast.error("Failed to update status");
      setData((d) => {
        if (!d) return null;
        return {
          ...d,
          goals: d.goals.map((g) => (g.id === id ? { ...g, done: !nextStatus } : g)),
        };
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

  const addGoal = (g: NewGoalInput & { id: string }) => {
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-8 flex flex-col">
        <div className="grid gap-6 flex-1">
          {/* Greeting Card - Only show on Overview and Nutrition */}
          {(activeTab === "overview" || activeTab === "nutrition") && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="relative overflow-hidden bg-gradient-brand p-8 text-white shadow-glow border-none">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hi, {user.name.split(" ")[0]}!</h1>
                    <p className="mt-2 text-white/80 max-w-md">
                      You've completed {completedCount} goals today. Keep up the momentum, your coach
                      is cheering you on!
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-center min-w-24">
                      <p className="text-3xl font-bold">{completedCount}</p>
                      <p className="text-[10px] uppercase font-bold text-white/60">Done</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-center min-w-24">
                      <p className="text-3xl font-bold">{(data.goals || []).length}</p>
                      <p className="text-[10px] uppercase font-bold text-white/60">Total</p>
                    </div>
                  </div>
                </div>
                <Sparkles className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10" />
              </Card>
            </motion.div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-muted-foreground">Recent actions</p>
                      <p className="text-sm font-bold truncate">
                        {data.recentCheckins && data.recentCheckins.length > 0
                          ? data.recentCheckins[0].note
                          : "No actions yet"}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Today's progress</p>
                      <p className="text-2xl font-bold">
                        {completedCount}/{(data.goals || []).length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card
                  className="p-6 cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => navigate({ to: "/app", search: { tab: "nutrition" } })}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Today's Calories</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {todayCalories}
                          <span className="ml-1 text-sm font-normal text-muted-foreground">kcal</span>
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="relative p-6">
                  {!!data.unreadCount && data.unreadCount > 0 && (
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg animate-pulse">
                      {data.unreadCount > 9 ? "9+" : data.unreadCount}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-muted-foreground">Coach {data.coachName}</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {data.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">Today's goals</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Check them off as you go. We'll celebrate with you.
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
                          className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${g.done ? "text-muted-foreground line-through" : ""}`}
                            >
                              {g.title}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] h-4 py-0">
                                {g.category}
                              </Badge>
                              <Badge
                                variant={g.priority === "high" ? "destructive" : "secondary"}
                                className="text-[9px] h-4 py-0"
                              >
                                {g.priority}
                              </Badge>
                              {g.coachFeedback && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 py-0 bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  Feedback
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {g.done ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] px-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => toggle(g.id)}
                              >
                                Still Active
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => toggle(g.id)}
                              >
                                Mark as Completed
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-primary"
                              onClick={() => setPreviewGoal(g)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setGoalToDelete(g.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                    {(!data.goals || data.goals.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Target className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold">No goals yet</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add your first goal to start tracking your progress.
                        </p>
                      </div>
                    )}
                  </ul>
                </Card>

                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Weekly Activity</h2>
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="mt-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.weekly || []}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            dy={10}
                          />
                          <YAxis
                            hide={false}
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            width={30}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                              fontSize: 12,
                              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            }}
                            cursor={{
                              stroke: "var(--primary)",
                              strokeWidth: 1,
                              strokeDasharray: "4 4",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="var(--primary)"
                            strokeWidth={4}
                            dot={{
                              r: 4,
                              fill: "var(--primary)",
                              strokeWidth: 2,
                              stroke: "var(--card)",
                            }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
                            animationDuration={1500}
                          />
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
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Today's Calories</p>
                      <p className="text-2xl font-bold">
                        {todayCalories}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">kcal</span>
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Food Log</h2>
                      <p className="text-sm text-muted-foreground">
                        Track your meals and get AI feedback.
                      </p>
                    </div>
                    <AddFoodDialog
                      onAdd={(entry) => setFoodEntries([entry, ...(foodEntries || [])])}
                    />
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
                  <div className="space-y-4">
                    {(foodEntries || []).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-border p-4 transition-all hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          {entry.imageUrl && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden border border-border shrink-0">
                              <img
                                src={getMediaUrl(entry.imageUrl)}
                                alt={entry.foodName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-foreground">{entry.foodName}</h3>
                                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Utensils className="h-3 w-3" />{" "}
                                    {entry.portion || "Normal portion"}
                                  </span>
                                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                                    <Flame className="h-3 w-3" /> {entry.calories || 0} kcal
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
                                    {entry.entryTime
                                      ? new Date(entry.entryTime).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-muted/30">
                                {entry.entryTime
                                  ? new Date(entry.entryTime).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Today"}
                              </Badge>
                            </div>
                            {entry.aiFeedback && (
                              <div className="mt-3 rounded-lg bg-primary/5 p-3 border border-primary/10">
                                <div className="flex items-center gap-2 mb-1">
                                  <Sparkles className="h-3 w-3 text-primary" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                    AI Coach Feedback
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed italic">
                                  "{entry.aiFeedback}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {entry.coachFeedback && (
                          <div className="mt-3 rounded-lg bg-amber-50 p-3 border border-amber-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-3 w-3 text-amber-600" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                Coach Feedback
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {entry.coachFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 h-fit">
                  <h3 className="font-semibold mb-4">Nutritional Tips</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      Drink at least 8 glasses of water daily.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      Prioritize protein in every meal.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      Try to eat whole foods instead of processed ones.
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="-mx-4 -mb-8 flex-1 md:mx-0 md:mb-0">
              <AIAssistant />
            </div>
          )}

          {activeTab === "chat" && (
            <div className="mx-auto max-w-4xl w-full -mx-4 -mb-8 flex-1 md:mx-0 md:mb-0">
              <ChatInterface peerId={data.coachId} peerName={data.coachName} />
            </div>
          )}
        </div>
      </main>

      <GoalPreviewDialog
        goal={previewGoal}
        onClose={() => setPreviewGoal(null)}
        onToggle={toggle}
      />

      <AlertDialog open={!!goalToDelete} onOpenChange={(o) => !o && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
