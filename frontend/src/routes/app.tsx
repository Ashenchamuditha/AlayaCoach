import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
import { Sparkles, Target, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { AIAssistant } from "@/components/AIAssistant";
import { StopwatchTimer } from "@/components/StopwatchTimer";
import { AddGoalDialog, type NewGoalInput } from "@/components/AddGoalDialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit2, Clock, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Alaya Master Coach" },
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
}

interface DashboardData {
  goals: Goal[];
  aiFeedback: string;
  streak: number;
  weekly: { day: string; score: number }[];
  coachId: string;
  coachName: string;
  lastMessage?: string;
  unreadCount?: number;
}

function GoalDetailDialog({ 
  goal, 
  onClose, 
  onUpdate, 
  onDelete 
}: { 
  goal: Goal | null, 
  onClose: () => void, 
  onUpdate: (g: Goal) => void,
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setForm({ ...goal });
      setEditing(false);
    }
  }, [goal]);

  if (!goal || !form) return null;

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/goals/${goal.id}`, form);
      onUpdate({ ...data, id: String(data.id) });
      toast.success("Goal updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await api.delete(`/goals/${goal.id}`);
      onDelete(goal.id);
      toast.success("Goal deleted");
      onClose();
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  return (
    <Dialog open={!!goal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{editing ? "Edit Goal" : goal.title}</DialogTitle>
            {!editing && (
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogDescription>
            {editing ? "Modify your goal details below." : goal.description || "No description provided."}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({...form, priority: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline"><Calendar className="mr-1 h-3 w-3" /> {goal.dueDate || "Today"}</Badge>
              <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> {goal.startTime} - {goal.endTime}</Badge>
              <Badge variant="secondary">{goal.durationMinutes} min</Badge>
              <Badge variant={goal.priority === "high" ? "destructive" : "default"}>{goal.priority}</Badge>
            </div>
          </div>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={saving} className="bg-gradient-brand text-white">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientDashboard() {
  const { user, hydrate, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

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
    api
      .get<DashboardData>("/dashboard/client")
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error("Dashboard fetch failed:", err);
        setError("Failed to load dashboard data. Please check your connection.");
      });
  }, []);

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

  const completed = data.goals.filter((g) => g.done).length;

  const toggle = async (id: string) => {
    const goal = data.goals.find((g) => g.id === id);
    if (!goal) return;
    const next = !goal.done;
    setData((d) => {
      if (!d) return null;
      return {
        ...d,
        goals: d.goals.map((g) => (g.id === id ? { ...g, done: next } : g)),
      };
    });
    if (next) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    try {
      await api.post("/checkins", { goalId: id, completed: next });
    } catch {
      // ignore
    }
  };

  const addGoal = (g: NewGoalInput & { id: string }) => {
    setData((d) => {
      if (!d) return null;
      return {
        ...d,
        goals: [
          ...d.goals,
          {
            id: g.id,
            title: g.title,
            done: false,
            category: g.category,
            priority: g.priority,
            dueDate: g.dueDate,
            durationMinutes: g.durationMinutes,
          },
        ],
      };
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight">
            Hi, <span className="text-gradient-brand">{user.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Here is your day at a glance.</p>
        </motion.div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            <TabsTrigger value="chat">Chat with Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-white">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current streak</p>
                    <p className="text-2xl font-bold">{data.streak} days</p>
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
                      {completed}/{data.goals.length}
                    </p>
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
                    <p className="text-sm font-medium line-clamp-1">{data.lastMessage || "No messages yet"}</p>
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
                  {data.goals.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`goal-${g.id}`}
                        checked={g.done}
                        onCheckedChange={() => toggle(g.id)}
                      />
                      <label
                        htmlFor={`goal-${g.id}`}
                        className={`flex-1 cursor-pointer text-sm ${
                          g.done ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {g.title}
                      </label>
                      {g.priority && (
                        <Badge
                          variant={
                            g.priority === "high"
                              ? "destructive"
                              : g.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {g.priority}
                        </Badge>
                      )}
                      {g.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {g.category}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-soft">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">AI Coach</h2>
                </div>
                <p className="text-sm leading-relaxed">{data.aiFeedback}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-lg font-semibold">Weekly progress</h2>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--primary)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div>
              <StopwatchTimer />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <div className="mx-auto max-w-3xl">
              <AIAssistant />
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="mx-auto max-w-3xl">
              <ChatInterface peerId={data.coachId} peerName={data.coachName} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
