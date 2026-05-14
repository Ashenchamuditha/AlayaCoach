import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface ChatMessage {
  id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read?: boolean;
}

export function createChatClient(token: string, onMessage: (m: ChatMessage) => void) {
  const client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws-chat") as unknown as WebSocket,
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
  };

  return client;
}
