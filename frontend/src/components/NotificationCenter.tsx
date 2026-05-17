import { useState, useEffect } from "react";
import { Bell, Check, Trash2, MessageSquare, Utensils, Target, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { createChatClient } from "@/lib/ws";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "MESSAGE" | "FOOD_FEEDBACK" | "GOAL_UPDATE" | "GOAL_COMPLETE" | "NEW_CLIENT" | "AI_SUGGESTION" | "SYSTEM";
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get<Notification[]>("/notifications");
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();

    const ws = createChatClient(
      token,
      () => {}, // ignore chat messages here
      (update) => {
        if (update.type === "NEW_NOTIFICATION" && update.notification) {
          setNotifications((prev) => [update.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast(update.notification.title, {
            description: update.notification.message,
            action: {
              label: "View",
              onClick: () => handleNotificationClick(update.notification),
            },
          });
        }
      }
    );
    ws.activate();
    return () => {
      ws.deactivate();
    };
  }, [token]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);

    // Navigation logic based on type
    switch (n.type) {
      case "MESSAGE":
        navigate({ to: n.relatedId ? "/app" : "/chat", search: { tab: "chat" } as any });
        break;
      case "FOOD_FEEDBACK":
        navigate({ to: "/app", search: { tab: "nutrition" } as any });
        break;
      case "GOAL_UPDATE":
      case "GOAL_COMPLETE":
        navigate({ to: "/app", search: { tab: "overview" } as any });
        break;
      case "AI_SUGGESTION":
        navigate({ to: "/app", search: { tab: "ai" } as any });
        break;
      default:
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "MESSAGE": return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "FOOD_FEEDBACK": return <Utensils className="h-4 w-4 text-orange-500" />;
      case "GOAL_COMPLETE": return <Target className="h-4 w-4 text-green-500" />;
      case "GOAL_UPDATE": return <Target className="h-4 w-4 text-primary" />;
      case "AI_SUGGESTION": return <Bot className="h-4 w-4 text-purple-500" />;
      case "NEW_CLIENT": return <Sparkles className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-border/50">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] uppercase font-bold text-primary">
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 opacity-20 mb-2" />
              <p className="text-xs">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-border/10 last:border-0 ${
                  !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className={`mt-1 p-2 rounded-lg ${!n.isRead ? "bg-white shadow-sm" : "bg-muted"}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-none ${!n.isRead ? "font-bold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
