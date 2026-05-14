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
  done: boolean;
  category?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  durationMinutes?: number;
}

interface DashboardData {
  goals: Goal[];
  aiFeedback: string;
  streak: number;
  weekly: { day: string; score: number }[];
  coachId: string;
  coachName: string;
}

const demoData: DashboardData = {
  goals: [
    { id: "1", title: "Morning meditation (10 min)", done: true },
    { id: "2", title: "Workout — strength training", done: false },
    { id: "3", title: "Deep work block (90 min)", done: false },
    { id: "4", title: "Read 20 pages", done: false },
  ],
  aiFeedback:
    "You're on a 6-day streak — momentum is building. Try anchoring your deep work right after meditation to stack wins early.",
  streak: 6,
  weekly: [
    { day: "Mon", score: 60 },
    { day: "Tue", score: 75 },
    { day: "Wed", score: 80 },
    { day: "Thu", score: 70 },
    { day: "Fri", score: 90 },
    { day: "Sat", score: 85 },
    { day: "Sun", score: 95 },
  ],
  coachId: "demo-coach",
  coachName: "Coach Maya",
};

function ClientDashboard() {
  const { user, hydrate } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    if (!goal) return;
    const next = !goal.done;
    setData((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, done: next } : g)),
    }));
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
    setData((d) => ({
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
    }));
  };

  if (!user) return null;
  const completed = data.goals.filter((g) => g.done).length;

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
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coach</p>
                    <p className="text-2xl font-bold">{data.coachName}</p>
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
