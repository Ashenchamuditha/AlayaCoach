import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const suggestions = [
  "Plan a workout for me",
  "Healthy meal ideas",
  "How to track my macros?",
  "I'm feeling unmotivated today",
];

const fallbackReply = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("diet") || t.includes("meal") || t.includes("eat"))
    return "Focus on whole foods: high protein, complex carbs, and healthy fats. Avoid processed sugars and stay hydrated. Want a specific meal plan for your fitness level?";
  if (t.includes("motivat") || t.includes("unmotivat"))
    return "Motivation follows action. Pick the smallest possible version of your next goal — 2 minutes is enough — and start a timer. Momentum will do the rest.";
  if (t.includes("plan"))
    return "Block your day in 3 chunks: a 90-min deep work session in the morning, one health habit at midday, and a short reflection at night. Want me to draft it?";
  if (t.includes("workout"))
    return "Try this 20-min set: 5 min mobility, 3 rounds of (10 push-ups, 15 squats, 30s plank), 5 min cooldown. Hydrate well.";
  if (t.includes("consist"))
    return "Consistency = anchor + small + visible. Anchor the habit to an existing routine, keep it tiny, and track it where you'll see it daily.";
  return "I'm here to help with your fitness, diet, and mindset. Break your next step into a 5-minute action and let me know how it goes!";
};

interface Props {
  initialPrompt?: string;
}

export function AIAssistant({ initialPrompt }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [text, setText] = useState(initialPrompt || "");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    api.get<AIMessage[]>("/ai/history").then((r) => {
      if (r.data && r.data.length > 0) {
        setMessages(r.data);
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I'm your AI Assistant. Ask me about fitness routines, diet plans, workout tracking, or mindset coaching.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (raw?: string) => {
    const content = (raw ?? text).trim();
    if (!content || loading) return;
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);
    setText("");
    setLoading(true);
    try {
      const r = await api.post<{ reply: string }>("/chat/ai", { message: content });
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: r.data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallbackReply(content),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-full min-h-[450px] flex-col overflow-hidden p-0 border-none shadow-none md:border-solid md:shadow-sm md:h-[600px] md:rounded-xl">
      <div className="flex items-center gap-2.5 md:gap-3 border-b border-border bg-gradient-soft px-3 md:px-4 py-2.5 md:py-3 shrink-0">
        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <p className="text-xs md:text-sm font-bold">AI Assistant</p>
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-tight">Always here to help</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-3 md:p-6">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.role === "user";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] md:max-w-[80%] rounded-2xl px-3.5 py-2 text-xs md:text-sm shadow-sm",
                    mine
                      ? "rounded-br-sm bg-gradient-brand text-white"
                      : "rounded-bl-sm border border-border bg-card text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-1.5 text-sm">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border bg-background px-3 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] md:text-xs font-medium hover:bg-muted transition-colors active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border bg-background p-2.5 md:p-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask the AI Assistant..."
          className="flex-1 text-sm h-9 md:h-10 px-3"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading}
          className="h-9 w-9 md:h-10 md:w-10 bg-gradient-brand text-white hover:opacity-90 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
