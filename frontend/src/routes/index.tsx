import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CountUpNS from "react-countup";
const CountUp = (CountUpNS as unknown as { default?: typeof CountUpNS }).default ?? CountUpNS;
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alaya Master Coach ✨ - Your Personal Accountability Partner" },
      {
        name: "description",
        content:
          "Alaya Master Coach pairs you with an AI-driven accountability partner and a real coach. Track habits, chat in real-time, and grow daily.",
      },
      { property: "og:title", content: "Alaya Master Coach" },
      { property: "og:description", content: "Your personal accountability partner." },
    ],
  }),
  component: LandingPage,
});

interface PublicStats {
  activeUsers?: number;
  coaches?: number;
  goalsCompleted?: number;
  messagesExchanged?: number;
}

const features = [
  {
    icon: Target,
    title: "Track Habits",
    desc: "Build daily rituals with smart reminders and a check-in system designed by behavioral scientists.",
  },
  {
    icon: Zap,
    title: "AI Coach",
    desc: "Get instant, personalized feedback after every check-in. Your AI coach learns your patterns and pushes you forward.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    desc: "Talk to your human coach anytime via end-to-end real-time messaging. Stay accountable, stay supported.",
  },
];

function LandingPage() {
  const { user, hydrate } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats>({
    activeUsers: 0,
    coaches: 0,
    goalsCompleted: 0,
    messagesExchanged: 0,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) {
      navigate({ to: user.role === "COACH" ? "/coach" : "/app" });
    }
  }, [user, navigate]);

  useEffect(() => {
    api
      .get<PublicStats>("/public/stats")
      .then((r) => setStats((s) => ({ ...s, ...r.data })))
      .catch(() => {
        // keep demo defaults
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
          </div>
          <div className="container mx-auto px-4 py-24 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-1.5 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Trusted by {(stats.activeUsers ?? 0).toLocaleString()}+ ambitious humans
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                <span className="text-gradient-brand flex items-center justify-center gap-3">
                  <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-primary animate-pulse" />
                  Alaya Master Coach
                </span>
                <br />
                <span className="text-foreground">Your Personal Accountability Partner</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Pair daily AI insights with a real human coach. Build habits that stick, chat in
                real time, and become the version of you that follows through.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-brand text-white shadow-glow hover:opacity-90"
                >
                  <Link to="/register">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">I already have an account</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to follow through
            </h2>
            <p className="mt-3 text-muted-foreground">
              A complete toolkit for habit-building, coaching, and accountability.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="group h-full p-8 transition-all hover:shadow-glow">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow transition-transform group-hover:scale-110">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gradient-soft py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mx-auto mb-12 max-w-2xl text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Real progress, in real time
              </h2>
              <p className="mt-3 text-muted-foreground">
                Live numbers from the Alaya community right now.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active users", value: stats.activeUsers ?? 0, icon: Users },
                { label: "Certified coaches", value: stats.coaches ?? 0, icon: Sparkles },
                { label: "Goals completed", value: stats.goalsCompleted ?? 0, icon: CheckCircle2 },
                {
                  label: "Messages exchanged",
                  value: stats.messagesExchanged ?? 0,
                  icon: MessageCircle,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="p-6 text-center">
                    <s.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                    <div className="text-3xl font-bold tracking-tight md:text-4xl text-gradient-brand">
                      <CountUp end={s.value} duration={2.4} separator="," />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-24">
          <Card className="relative overflow-hidden p-12 text-center">
            <div className="absolute inset-0 -z-10 bg-gradient-brand opacity-10" />
            <h2 className="text-3xl font-bold md:text-4xl">Start your 14-day free trial</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-gradient-brand text-white shadow-glow hover:opacity-90"
            >
              <Link to="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
