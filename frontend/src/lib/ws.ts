import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface ChatMessage {
  id?: string | number;
  senderId: string | number;
  receiverId: string | number;
  content: string;
  timestamp: string;
  read?: boolean;
}

export interface GenericUpdate {
  type: "GOAL_UPDATE" | "GOAL_DELETED" | "DASHBOARD_REFRESH" | "FOOD_FEEDBACK" | "NEW_NOTIFICATION";
  goalId?: string | number;
  clientId?: string | number;
  status?: string;
  notification?: any;
}

export function createChatClient(
  token: string,
  onMessage: (m: ChatMessage) => void,
  onUpdate?: (u: GenericUpdate) => void,
) {
  const wsUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8081/ws-chat`
      : "http://localhost:8081/ws-chat";

  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 4000,
    debug: () => {},
  });

  client.onConnect = () => {
    client.subscribe("/user/queue/messages", (frame: IMessage) => {
      try {
        onMessage(JSON.parse(frame.body));
      } catch {
        // ignore
      }
    });

    if (onUpdate) {
      client.subscribe("/user/queue/updates", (frame: IMessage) => {
        try {
          onUpdate(JSON.parse(frame.body));
        } catch {
          // ignore
        }
      });

      client.subscribe("/user/queue/notifications", (frame: IMessage) => {
        try {
          onUpdate(JSON.parse(frame.body));
        } catch {
          // ignore
        }
      });
    }
  };

  return client;
}
