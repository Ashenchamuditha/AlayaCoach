import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, TrendingUp, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — Alaya Master Coach" },
      { name: "description", content: "Manage your clients and chat in real time." },
    ],
  }),
  component: CoachDashboard,
});

interface Client {
  id: string;
  name: string;
  streak: number;
  completion: number;
  lastActive: string;
  weekly: { day: string; score: number }[];
}

const demoClients: Client[] = [
  {
    id: "c1",
    name: "Sarah Chen",
    streak: 12,
    completion: 87,
    lastActive: "2h ago",
    weekly: [
      { day: "Mon", score: 70 },
      { day: "Tue", score: 80 },
      { day: "Wed", score: 90 },
      { day: "Thu", score: 75 },
      { day: "Fri", score: 95 },
      { day: "Sat", score: 88 },
      { day: "Sun", score: 92 },
    ],
  },
  {
    id: "c2",
    name: "Marcus Lee",
    streak: 4,
    completion: 62,
    lastActive: "1d ago",
    weekly: [
      { day: "Mon", score: 50 },
      { day: "Tue", score: 60 },
      { day: "Wed", score: 65 },
      { day: "Thu", score: 55 },
      { day: "Fri", score: 70 },
      { day: "Sat", score: 60 },
      { day: "Sun", score: 72 },
    ],
  },
  {
    id: "c3",
    name: "Aisha Patel",
    streak: 21,
    completion: 95,
    lastActive: "30m ago",
    weekly: [
      { day: "Mon", score: 90 },
      { day: "Tue", score: 95 },
      { day: "Wed", score: 100 },
      { day: "Thu", score: 90 },
      { day: "Fri", score: 100 },
      { day: "Sat", score: 95 },
      { day: "Sun", score: 100 },
    ],
  },
  {
    id: "c4",
    name: "Diego Alvarez",
    streak: 8,
    completion: 74,
    lastActive: "5h ago",
    weekly: [
      { day: "Mon", score: 60 },
      { day: "Tue", score: 70 },
      { day: "Wed", score: 75 },
      { day: "Thu", score: 80 },
      { day: "Fri", score: 70 },
      { day: "Sat", score: 78 },
      { day: "Sun", score: 82 },
    ],
  },
];

function CoachDashboard() {
  const { user, hydrate } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [chatting, setChatting] = useState(false);

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
  }, []);

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
                Welcome, <span className="text-gradient-brand">Coach {user.name.split(" ")[0]}</span>
              </h1>
              <p className="mt-1 text-muted-foreground">
                {clients.length} active clients today.
              </p>
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
                      className="group cursor-pointer p-6 transition hover:-translate-y-0.5 hover:shadow-glow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">Last active {c.lastActive}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Streak</p>
                          <p className="text-xl font-bold">{c.streak}d</p>
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
                setSelected(null);
                setChatting(false);
              }}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to clients
            </Button>

            {!chatting ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white">
                      {selected.name
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
                    <Users className="mb-2 h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">Streak</p>
                    <p className="text-2xl font-bold">{selected.streak} days</p>
                  </Card>
                  <Card className="p-6">
                    <TrendingUp className="mb-2 h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">Completion rate</p>
                    <p className="text-2xl font-bold">{selected.completion}%</p>
                  </Card>
                  <Card className="p-6 bg-gradient-soft">
                    <p className="text-xs text-muted-foreground">Coach note</p>
                    <p className="mt-1 text-sm">
                      Strong week. Push for one stretch goal next session.
                    </p>
                  </Card>
                </div>

                <Card className="mt-6 p-6">
                  <h2 className="text-lg font-semibold">Weekly progress</h2>
                  <div className="mt-4 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selected.weekly}>
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
                        <Bar dataKey="score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                      </BarChart>
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
