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
        if (update.type === "GOAL_UPDATE" || update.type === "GOAL_DELETED") {
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
    } else {
      setSelectedGoals([]);
      setSelectedFoodEntries([]);
    }
  }, [selected]);

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
      fetchClients();
    } catch {
      console.error("Failed to delete goal");
    } finally {
      setGoalToDelete(null);
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
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome,{" "}
                <span className="text-gradient-brand">
                  Coach {(user.name || "User").split(" ")[0]}
                </span>
              </h1>
              <p className="mt-1 text-muted-foreground">{clients.length} active clients today.</p>
            </motion.div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clients.length === 0 ? (
                <Card className="col-span-full p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                  <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
                  <p className="text-muted-foreground">
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
                      className="group relative cursor-pointer p-6 transition hover:-translate-y-0.5 hover:shadow-glow"
                    >
                      {!!c.unreadCount && c.unreadCount > 0 && (
                        <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg animate-pulse">
                          {c.unreadCount > 9 ? "9+" : c.unreadCount}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
                          {(c.name || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last active {c.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> Recent Message
                        </p>
                        <p className="text-sm line-clamp-1 mt-0.5 text-muted-foreground">
                          {c.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Active Goals</p>
                          <p className="text-xl font-bold">{c.activeGoals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completion</p>
                          <p className="text-xl font-bold text-gradient-brand">{c.completion}%</p>
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
              <ArrowLeft className="mr-2 h-4 w-4" /> {chatting ? "Back to client details" : "Back to clients"}
            </Button>

            {!chatting ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white">
                      {(selected.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{selected.name}</h1>
                      <p className="text-sm text-muted-foreground">
                        Last active {selected.lastActive}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setChatting(true)}
                    className="bg-gradient-brand text-white hover:opacity-90"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> New Chat
                  </Button>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <Card className="p-6">
                    <TrendingUp className="mb-2 h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">Completion rate</p>
                    <p className="text-2xl font-bold">{selected.completion}%</p>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <p className="text-xs text-muted-foreground">Active Goals</p>
                    </div>
                    <p className="text-2xl font-bold">{selected.activeGoals}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedGoals?.length || 0} total goals assigned
                    </p>
                  </Card>
                  <Card className="p-6 bg-gradient-soft border-primary/20">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Weekly activity
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-2xl font-bold">Real-time</p>
                      <span className="text-xs text-primary font-medium">Tracking enabled</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on client check-ins this week
                    </p>
                  </Card>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Client Goals</h2>
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
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {!selectedGoals || selectedGoals.length === 0 ? (
                      <Card className="col-span-full p-12 text-center text-muted-foreground">
                        No goals found for this client.
                      </Card>
                    ) : (
                      selectedGoals.map((g) => (
                        <Card
                          key={g.id}
                          className="relative flex flex-col p-5 group hover:shadow-glow transition-all border-border/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <button
                              onClick={() => toggleGoal(g.id, g.status)}
                              className="transition-colors hover:text-primary"
                            >
                              {g.status === "COMPLETED" ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                g.priority === "HIGH"
                                  ? "bg-destructive/10 text-destructive"
                                  : g.priority === "MEDIUM"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {g.priority}
                            </span>
                          </div>

                          <div className="flex-1">
                            <h3
                              className={`font-semibold text-sm line-clamp-2 ${g.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}
                            >
                              {g.title}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <p className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                {g.category}
                              </p>
                              {g.coachFeedback && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 py-0 bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  Feedback
                                </Badge>
                              )}
                              {g.createdAt && (
                                <p className="text-[10px] text-muted-foreground bg-primary/5 px-2 py-0.5 rounded">
                                  Added:{" "}
                                  {new Date(g.createdAt).toLocaleString(undefined, {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              {g.dueDate && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(g.dueDate).toLocaleDateString()}
                                </div>
                              )}
                              {g.startTime && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {g.startTime}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setPreviewGoal(g);
                                  setPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingGoal(g);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setGoalToDelete(g.id)}
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

                <EditGoalDialog
                  goal={editingGoal}
                  open={editDialogOpen}
                  onOpenChange={setEditDialogOpen}
                  onUpdate={(updated) => {
                    setSelectedGoals((prev) =>
                      prev.map((g) => (g.id === updated.id ? updated : g)),
                    );
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

                <AlertDialog
                  open={!!goalToDelete}
                  onOpenChange={(o) => !o && setGoalToDelete(null)}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the client's
                        goal.
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

                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Client Food Logs</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {!selectedFoodEntries || selectedFoodEntries.length === 0 ? (
                      <Card className="col-span-full p-8 text-center text-muted-foreground">
                        No food logs found for this client.
                      </Card>
                    ) : (
                      selectedFoodEntries.map((entry) => (
                        <Card key={entry.id} className="p-5 border-border/50">
                          <div className="flex gap-4">
                            {entry.imageUrl && (
                              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                                <img
                                  src={getMediaUrl(entry.imageUrl)}
                                  alt={entry.foodName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-bold text-sm">{entry.foodName}</h3>
                                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-0.5">
                                      <Utensils className="h-3 w-3" /> {entry.portion || "Normal"}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-orange-600 font-medium">
                                      <Flame className="h-3 w-3" /> {entry.calories} kcal
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />{" "}
                                      {new Date(entry.entryTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                  {new Date(entry.entryTime).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </Badge>
                              </div>

                              {entry.aiFeedback && (
                                <div className="mb-3 rounded-lg bg-primary/5 p-2 border border-primary/10">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                                      AI Coach Feedback
                                    </span>
                                  </div>
                                  <p className="text-xs text-foreground/80 italic">
                                    "{entry.aiFeedback}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-border/50">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">
                              Your Feedback
                            </label>
                            {entry.coachFeedback ? (
                              <div className="rounded-lg bg-amber-50 p-2 border border-amber-100 text-xs text-foreground/80">
                                {entry.coachFeedback}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 ml-2 text-[10px] text-amber-700 underline"
                                  onClick={() => {
                                    const next = prompt("Edit feedback:", entry.coachFeedback);
                                    if (next !== null) submitFoodFeedback(entry.id, next);
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Type feedback..."
                                  className="h-8 text-xs"
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
                                  className="h-8 px-3 text-xs"
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
              <div className="mx-auto max-w-3xl">
                <ChatInterface peerId={selected.id} peerName={selected.name} />
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
