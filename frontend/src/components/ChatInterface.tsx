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
        content: content
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
    <Card className="flex h-[600px] flex-col overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-border bg-gradient-soft px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
          {peerName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{peerName}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.senderId === user?.id;
            return (
              <motion.div
                key={m.id ?? `${m.timestamp}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    mine
                      ? "rounded-br-sm bg-gradient-brand text-white"
                      : "rounded-bl-sm bg-card text-foreground border border-border",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                      mine ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {mine && <span>{m.read ? "✓✓" : "✓"}</span>}
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
