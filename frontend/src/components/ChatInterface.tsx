import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { createChatClient, type ChatMessage } from "@/lib/ws";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Props {
  peerId: string;
  peerName: string;
}

export function ChatInterface({ peerId, peerName }: Props) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const clientRef = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !user || !peerId) return;
    api
      .get<ChatMessage[]>(`/chat/history/${peerId}`)
      .then((r) => setMessages(r.data ?? []))
      .catch(() => {
        // fallback deleted for real integration
      });

    const c = createChatClient(token, (m) => {
      // Use == to handle string vs number comparison
      if (String(m.senderId) === String(peerId) || String(m.receiverId) === String(peerId)) {
        setMessages((prev) => [...prev, m]);
      }
    });
    c.activate();
    clientRef.current = c;
    return () => {
      c.deactivate();
    };
  }, [peerId, token, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !peerId) return;
    const content = text.trim();
    setText("");

    try {
      await api.post("/chat/send", {
        receiverId: peerId,
        content: content,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (!peerId) {
    return (
      <Card className="flex h-[400px] items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-muted-foreground">No coach assigned yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Once a coach is assigned to you, you can chat with them here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-[500px] flex-col overflow-hidden p-0 border-none shadow-none md:border-solid md:shadow-sm md:h-[700px] md:rounded-xl">
      <div className="flex items-center gap-3 border-b border-border bg-gradient-soft px-4 py-3 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white shadow-glow">
          {peerName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{peerName}</p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Your Human Coach
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6 bg-[#f8f9fa] dark:bg-[#0c0c0d]"
        style={{
          backgroundImage:
            theme === "dark"
              ? "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)"
              : "radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.senderId === user?.id;
            return (
              <motion.div
                key={m.id ?? `${m.timestamp}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all",
                    mine
                      ? "rounded-br-sm bg-gradient-brand text-white shadow-md shadow-primary/10"
                      : "rounded-bl-sm bg-card text-foreground border border-border/50",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                  <div
                    className={cn(
                      "mt-1.5 flex items-center justify-end gap-1.5 text-[9px] font-medium tracking-tight",
                      mine ? "text-white/70" : "text-muted-foreground/70",
                    )}
                  >
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {mine && (
                      <span className="flex">
                        <span className="text-primary-foreground/90">✓</span>
                        {m.read && <span className="-ml-0.5 text-primary-foreground/90">✓</span>}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border bg-background p-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" className="bg-gradient-brand text-white hover:opacity-90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
