import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Edit2,
  Eye,
  MessageCircle,
  Trash2,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Utensils,
  Sparkles,
  Flame,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatInterface } from "@/components/ChatInterface";
import { EditGoalDialog } from "@/components/EditGoalDialog";
import { AddGoalDialog } from "@/components/AddGoalDialog";
import { Input } from "@/components/ui/input";
import { api, getMediaUrl } from "@/lib/api";
import { createChatClient } from "@/lib/ws";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — Alaya Master Coach ✨" },
      { name: "description", content: "Manage your clients and chat in real time." },
    ],
  }),
  component: CoachDashboard,
});

interface Client {
  id: string;
  name: string;
  completion: number;
  activeGoals: number;
  lastActive: string;
  lastMessage?: string;
  unreadCount?: number;
  recentCheckins: {
    id: string;
    note: string;
    checkinTime: string;
  }[];
  weekly: { day: string; score: number }[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  targetValue?: number;
  targetUnit?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  createdAt?: string;
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
  aiFeedback?: string;
  coachFeedback?: string;
  imageUrl?: string;
}

function GoalPreviewDialog({
  goal,
  open,
  onOpenChange,
  onToggle,
  onSubmitFeedback,
  onDeleteFeedback,
}: {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string, status: string) => void;
  onSubmitFeedback: (id: string, feedback: string) => void;
  onDeleteFeedback: (id: string) => void;
}) {
  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{goal.title}</DialogTitle>
            <Badge
              variant={goal.status === "COMPLETED" ? "secondary" : "default"}
              className={
                goal.status === "COMPLETED"
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
              }
            >
              {goal.status === "COMPLETED" ? "Completed" : "Still Active"}
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
              <Badge variant={goal.priority === "HIGH" ? "destructive" : "default"}>
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

          <div className="pt-4 border-t border-border/50">
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">
              Coach Feedback
            </label>
            {goal.coachFeedback ? (
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-100 text-sm text-foreground/80">
                <p>{goal.coachFeedback}</p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-xs text-amber-700 underline"
                    onClick={() => {
                      const next = prompt("Edit feedback:", goal.coachFeedback);
                      if (next !== null) onSubmitFeedback(goal.id, next);
                    }}
                  >
                    Edit Feedback
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-xs text-destructive underline"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this feedback?")) {
                        onDeleteFeedback(goal.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Add feedback for this goal..."
                  className="h-9 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSubmitFeedback(goal.id, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-9 px-4 bg-primary text-white"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    onSubmitFeedback(goal.id, input.value);
                    input.value = "";
                  }}
                >
                  Send
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {goal.status === "COMPLETED" ? (
            <Button
              className="w-full sm:flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
              variant="outline"
              onClick={() => {
                onToggle(goal.id, goal.status);
                onOpenChange(false);
              }}
            >
              Mark as Still Active
            </Button>
          ) : (
            <Button
              className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                onToggle(goal.id, goal.status);
                onOpenChange(false);
              }}
            >
              Mark as Completed
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoachDashboard() {
  const { user, hydrate, token } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedFoodEntries, setSelectedFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [chatting, setChatting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewGoal, setPreviewGoal] = useState<Goal | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<number | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const fetchClients = () => {
    api
      .get<Client[]>("/dashboard/coach/clients")
      .then((r) => {
        if (r.data) setClients(r.data);
      })
      .catch((err) => {
        console.error("Coach dashboard failed:", err);
        setError("Could not load clients. Please try again later.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!useAuth.getState().user) navigate({ to: "/login" });
    }, 50);
    return () => clearTimeout(t);
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    fetchClients();
  }, []);

  useEffect(() => {
    if (!token) return;
    const ws = createChatClient(
      token,
      (msg) => {
        fetchClients();
      },
      (update) => {
        if (
          update.type === "GOAL_UPDATE" ||
          update.type === "GOAL_UPDATED" ||
          update.type === "GOAL_DELETED" ||
          update.type === "NEW_NOTIFICATION"
        ) {
          fetchClients();
          if (selected && String(selected.id) === String(update.clientId)) {
            api.get<Goal[]>(`/goals/client/${selected.id}`).then((r) => {
              if (r.data) setSelectedGoals(r.data);
            });
          }
        }
      },
    );
    ws.activate();
    return () => {
      ws.deactivate();
    };
  }, [token, selected]);

  useEffect(() => {
    if (selected) {
      api.get<Goal[]>(`/goals/client/${selected.id}`).then((r) => {
        if (r.data) setSelectedGoals(r.data);
      });
      api.get<FoodEntry[]>(`/food/client/${selected.id}`).then((r) => {
        if (r.data) setSelectedFoodEntries(r.data);
      });
      api.get<WeeklyReport>(`/reports/latest/client/${selected.id}`)
        .then((r) => setWeeklyReport(r.data))
        .catch((err) => {
          if (err.response?.status === 404) setWeeklyReport(null);
        });
    } else {
      setSelectedGoals([]);
      setSelectedFoodEntries([]);
      setWeeklyReport(null);
    }
  }, [selected]);

  const generateReport = async () => {
    if (!selected) return;
    setIsGeneratingReport(true);
    try {
      const { data } = await api.post<WeeklyReport>(`/reports/generate/client/${selected.id}`);
      setWeeklyReport(data);
      toast.success("New AI coach brief generated!");
    } catch (err) {
      console.error("Report generation failed:", err);
      toast.error("Failed to generate brief");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const submitFoodFeedback = async (entryId: number, feedback: string) => {
    try {
      await api.post(`/food/${entryId}/feedback`, { feedback });
      setSelectedFoodEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, coachFeedback: feedback } : e)),
      );
      toast.success("Feedback sent");
    } catch {
      toast.error("Failed to send feedback");
    }
  };

  const deleteFoodFeedback = async (entryId: number) => {
    try {
      await api.delete(`/food/${entryId}/feedback`);
      setSelectedFoodEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, coachFeedback: undefined } : e)),
      );
      toast.success("Feedback deleted");
    } catch {
      toast.error("Failed to delete feedback");
    }
  };

  const submitGoalFeedback = async (goalId: string, feedback: string) => {
    try {
      await api.post(`/goals/${goalId}/feedback`, { feedback });
      setSelectedGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, coachFeedback: feedback } : g)),
      );
      if (previewGoal?.id === goalId) {
        setPreviewGoal((prev) => (prev ? { ...prev, coachFeedback: feedback } : null));
      }
      toast.success("Goal feedback sent");
    } catch {
      toast.error("Failed to send goal feedback");
    }
  };

  const deleteGoalFeedback = async (goalId: string) => {
    try {
      await api.delete(`/goals/${goalId}/feedback`);
      setSelectedGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, coachFeedback: undefined } : g)),
      );
      if (previewGoal?.id === goalId) {
        setPreviewGoal((prev) => (prev ? { ...prev, coachFeedback: undefined } : null));
      }
      toast.success("Goal feedback deleted");
    } catch {
      toast.error("Failed to delete goal feedback");
    }
  };

  useEffect(() => {
    if (selected) {
      const updated = (clients || []).find((c) => String(c.id) === String(selected.id));
      if (updated && JSON.stringify(updated) !== JSON.stringify(selected)) {
        setSelected(updated);
      }
    }
  }, [clients, selected]);

  const toggleGoal = async (goalId: string, currentStatus: string) => {
    try {
      const isCompleted = currentStatus === "COMPLETED";
      const { data } = await api.patch(`/goals/${goalId}/toggle?completed=${!isCompleted}`);
      setSelectedGoals((prev) => prev.map((g) => (g.id === goalId ? data : g)));
      fetchClients();
    } catch {
      console.error("Failed to toggle goal");
    }
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await api.delete(`/goals/${goalToDelete}`);
      setSelectedGoals((prev) => prev.filter((g) => g.id !== goalToDelete));
      toast.success("Goal deleted");
      fetchClients();
    } catch {
      console.error("Failed to delete goal");
    } finally {
      setGoalToDelete(null);
    }
  };

  const confirmDeleteFood = async () => {
    if (foodToDelete === null) return;
    try {
      await api.delete(`/food/delete/${foodToDelete}`);
      setSelectedFoodEntries((prev) => prev.filter((f) => f.id !== foodToDelete));
      toast.success("Food log deleted");
      fetchClients();
    } catch (err) {
      console.error("Failed to delete food log:", err);
      toast.error("Failed to delete food log");
    } finally {
      setFoodToDelete(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading clients...</p>
          </div>
        </main>
      </div>
    );
  }

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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        {!selected && (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome,{" "}
                <span className="text-gradient-brand">
                  Coach {(user.name || "User").split(" ")[0]}
                </span>
              </h1>
              <p className="mt-1 text-sm md:text-base text-muted-foreground">
                {clients.length} active clients today.
              </p>
            </motion.div>

            <div className="mt-6 grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clients.length === 0 ? (
                <Card className="col-span-full p-8 md:p-12 text-center">
                  <Users className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground opacity-20" />
                  <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
                  <p className="text-sm text-muted-foreground">
                    New clients who register will be automatically assigned to you.
                  </p>
                </Card>
              ) : (
                clients.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      onClick={() => setSelected(c)}
                      className="group relative cursor-pointer p-5 md:p-6 transition hover:-translate-y-0.5 hover:shadow-glow"
                    >
                      {!!c.unreadCount && c.unreadCount > 0 && (
                        <div className="absolute right-3 top-3 md:right-4 md:top-4 flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-destructive text-[8px] md:text-[10px] font-bold text-white shadow-lg animate-pulse">
                          {c.unreadCount > 9 ? "9+" : c.unreadCount}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-gradient-brand text-xs md:text-sm font-semibold text-white shrink-0">
                          {(c.name || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm md:text-base truncate">{c.name}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            Active {c.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <MessageCircle className="h-2.5 w-2.5" /> Recent Message
                        </p>
                        <p className="text-xs md:text-sm line-clamp-1 mt-0.5 text-muted-foreground italic">
                          "{c.lastMessage || "No messages yet"}"
                        </p>
                      </div>
                      <div className="mt-4 md:mt-5 grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold">
                            Goals
                          </p>
                          <p className="text-lg md:text-xl font-bold">{c.activeGoals}</p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold">
                            Completion
                          </p>
                          <p className="text-lg md:text-xl font-bold text-gradient-brand">
                            {c.completion}%
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}

        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              variant="ghost"
              onClick={() => {
                if (chatting) {
                  setChatting(false);
                } else {
                  setSelected(null);
                }
              }}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />{" "}
              {chatting ? "Back to client details" : "Back to clients"}
            </Button>

            {!chatting ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-brand text-white shrink-0 text-lg md:text-xl font-bold shadow-glow">
                      {(selected.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl md:text-2xl font-bold truncate">{selected.name}</h1>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        Active {selected.lastActive}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setChatting(true)}
                    className="w-full sm:w-auto bg-gradient-brand text-white hover:opacity-90"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Message Client
                  </Button>
                </div>

                <div className="mt-6 grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3">
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50 col-span-2 md:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">AI Coach Brief</h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateReport}
                        disabled={isGeneratingReport}
                        className="text-xs bg-white/50 dark:bg-black/50"
                      >
                        {isGeneratingReport
                          ? "Analyzing..."
                          : weeklyReport
                            ? "Refresh"
                            : "Generate Report"}
                      </Button>
                    </div>
                    {weeklyReport ? (
                      <div className="space-y-3">
                        <p className="text-sm md:text-base leading-relaxed text-foreground/90 font-medium">
                          {weeklyReport.coachBrief}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-right">
                          Report for: {new Date(weeklyReport.startDate).toLocaleDateString()} -{" "}
                          {new Date(weeklyReport.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-2">
                        Click "Generate Report" to get a high-level AI analysis of this client's
                        progress over the last 7 days.
                      </p>
                    )}
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold">
                        Progress
                      </p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold">{selected.completion}%</p>
                  </Card>
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold">
                        Goals
                      </p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold">{selected.activeGoals}</p>
                  </Card>
                  <Card className="p-4 md:p-6 bg-gradient-soft border-primary/20 col-span-2 md:col-span-1">
                    <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                      Weekly activity
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg md:text-2xl font-bold leading-none">Tracking</p>
                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                        LIVE
                      </span>
                    </div>
                  </Card>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-bold">Client Goals</h2>
                    <AddGoalDialog
                      clientId={selected.id}
                      onAdd={() => {
                        api.get<Goal[]>(`/goals/client/${selected.id}`).then((r) => {
                          if (r.data) setSelectedGoals(r.data);
                        });
                        fetchClients();
                      }}
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {!selectedGoals || selectedGoals.length === 0 ? (
                      <Card className="col-span-full p-12 text-center text-muted-foreground">
                        No goals found for this client.
                      </Card>
                    ) : (
                      selectedGoals.map((g) => (
                        <Card
                          key={g.id}
                          className={cn(
                            "relative flex flex-col p-4 md:p-5 group hover:shadow-glow transition-all border-border/50",
                            !g.createdByCoach && "bg-indigo-50/30 border-indigo-100",
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleGoal(g.id, g.status)}
                                className="transition-colors hover:text-primary shrink-0"
                              >
                                {g.status === "COMPLETED" ? (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground opacity-50" />
                                )}
                              </button>
                              {!g.coachViewed && !g.createdByCoach && (
                                <Badge className="bg-blue-500 text-white animate-pulse text-[7px] h-3.5 px-1 py-0 border-none">
                                  NEW
                                </Badge>
                              )}
                              {g.deletedByClient && (
                                <Badge
                                  variant="destructive"
                                  className="text-[7px] h-3.5 px-1 py-0 uppercase font-black"
                                >
                                  User Deleted
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant={g.priority === "HIGH" ? "destructive" : "secondary"}
                              className="text-[9px] h-4 py-0 font-bold"
                            >
                              {g.priority}
                            </Badge>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`font-semibold text-sm line-clamp-2 leading-tight ${g.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}
                              >
                                {g.title}
                              </h3>
                              {!g.createdByCoach && (
                                <Badge
                                  variant="outline"
                                  className="text-[7px] h-3.5 bg-indigo-50 text-indigo-700 border-indigo-100 uppercase font-black tracking-tighter shrink-0"
                                >
                                  User Added
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="text-[9px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded font-medium">
                                {g.category}
                              </span>
                              {g.coachFeedback && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 py-0 bg-amber-50 text-amber-700 border-amber-200 font-bold"
                                >
                                  Has Feedback
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              {g.dueDate && (
                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground truncate">
                                  <Calendar className="h-2.5 w-2.5 shrink-0" />
                                  {new Date(g.dueDate).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                              )}
                              {g.startTime && (
                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                  {g.startTime}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary hover:bg-primary/5"
                                onClick={() => {
                                  setPreviewGoal(g);
                                  setPreviewDialogOpen(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary hover:bg-primary/5"
                                onClick={() => {
                                  setEditingGoal(g);
                                  setEditDialogOpen(true);
                                }}
                                title="Edit Goal"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setGoalToDelete(g.id)}
                                title="Delete Goal"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-10">
                  <h2 className="text-lg md:text-xl font-bold mb-4">Client Food Logs</h2>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {!selectedFoodEntries || selectedFoodEntries.length === 0 ? (
                      <Card className="col-span-full p-8 text-center text-muted-foreground bg-muted/20 border-dashed">
                        No food logs found for this client.
                      </Card>
                    ) : (
                      selectedFoodEntries.map((entry) => (
                        <Card
                          key={entry.id}
                          className="group p-4 md:p-5 border-border/50 hover:border-primary/20 transition-colors"
                        >
                          <div className="flex gap-4">
                            {entry.imageUrl && (
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border">
                                <img
                                  src={getMediaUrl(entry.imageUrl)}
                                  alt={entry.foodName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-bold text-sm md:text-base truncate">
                                    {entry.foodName}
                                  </h3>
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-[10px] text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1">
                                      <Utensils className="h-2.5 w-2.5" />{" "}
                                      {entry.portion || "Normal"}
                                    </span>
                                    <span className="flex items-center gap-1 text-orange-600 font-bold">
                                      <Flame className="h-2.5 w-2.5" /> {entry.calories} kcal
                                    </span>
                                    <span className="flex items-center gap-1 bg-muted/50 px-1.5 rounded">
                                      <Clock className="h-2.5 w-2.5" />{" "}
                                      {new Date(entry.entryTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <Badge variant="outline" className="text-[9px] font-bold">
                                    {new Date(entry.entryTime).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFoodToDelete(entry.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {entry.aiFeedback && (
                                <div className="mb-3 rounded-lg bg-primary/5 p-2 md:p-2.5 border border-primary/10">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-primary">
                                      AI Insight
                                    </span>
                                  </div>
                                  <p className="text-[11px] md:text-xs text-foreground/80 italic leading-relaxed">
                                    "{entry.aiFeedback}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 mt-1 border-t border-border/50">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1.5 block tracking-widest">
                              Your Coaching Feedback
                            </label>
                            {entry.coachFeedback ? (
                              <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-100 text-xs text-foreground/80 flex items-start justify-between gap-2">
                                <p className="leading-relaxed">{entry.coachFeedback}</p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-[10px] text-amber-700 underline"
                                    onClick={() => {
                                      const next = prompt("Edit feedback:", entry.coachFeedback);
                                      if (next !== null) submitFoodFeedback(entry.id, next);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-[10px] text-destructive underline"
                                    onClick={() => {
                                      if (confirm("Delete this feedback?")) {
                                        deleteFoodFeedback(entry.id);
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Type feedback for client..."
                                  className="h-8 text-xs md:text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      submitFoodFeedback(entry.id, e.currentTarget.value);
                                      e.currentTarget.value = "";
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 px-3 text-xs font-bold"
                                  onClick={(e) => {
                                    const input = e.currentTarget
                                      .previousElementSibling as HTMLInputElement;
                                    submitFoodFeedback(entry.id, input.value);
                                    input.value = "";
                                  }}
                                >
                                  Send
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <Card className="mt-8 p-6">
                  <h2 className="text-lg font-semibold">Weekly progress</h2>
                  <div className="mt-4 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selected.weekly || []}>
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
              </>
            ) : (
              <div className="mx-auto max-w-4xl w-full -mx-4 md:mx-auto h-[calc(100dvh-130px)] md:h-[750px] flex flex-col">
                <ChatInterface peerId={selected.id} peerName={selected.name} />
              </div>
            )}
          </motion.div>
        )}
      </main>

      <EditGoalDialog
        goal={editingGoal}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={(updated) => {
          setSelectedGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          fetchClients();
        }}
      />
      <GoalPreviewDialog
        goal={previewGoal}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onToggle={toggleGoal}
        onSubmitFeedback={submitGoalFeedback}
        onDeleteFeedback={deleteGoalFeedback}
      />

      <AlertDialog open={!!goalToDelete} onOpenChange={(o) => !o && setGoalToDelete(null)}>
        <AlertDialogContent className="dark:bg-[#0a0a0b] border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client's goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!foodToDelete} onOpenChange={(o) => !o && setFoodToDelete(null)}>
        <AlertDialogContent className="dark:bg-[#0a0a0b] border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Log?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client's food entry? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFood}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
