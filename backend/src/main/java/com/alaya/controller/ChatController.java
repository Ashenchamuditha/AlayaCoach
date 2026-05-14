package com.alaya.controller;

import com.alaya.dto.ChatMessageDto;
import com.alaya.dto.SendMessageRequest;
import com.alaya.model.User;
import com.alaya.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * ChatController exposes two communication channels:
 *
 * 1. REST  — POST /api/chat/send, GET /api/chat/history/{otherUserId}
 *    Used for sending messages via HTTP and fetching chat history.
 *
 * 2. STOMP — @MessageMapping("/chat.send") => /app/chat.send
 *    Used when client sends a message over an active WebSocket connection.
 *    Delivery to receiver happens via SimpMessagingTemplate in ChatService.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ---- REST Endpoints ----

    /**
     * Send a message via REST (HTTP fallback or initial send).
     * Also triggers real-time delivery to receiver's STOMP queue.
     */
    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal User sender) {
        ChatMessageDto dto = chatService.sendMessage(sender.getId(), req.getReceiverId(), req.getContent());
        return ResponseEntity.ok(dto);
    }

    /**
     * Fetch paginated conversation history with another user.
     * Also marks received messages as read.
     */
    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory(
            @PathVariable Long otherUserId,
            @AuthenticationPrincipal User currentUser) {
        List<ChatMessageDto> history = chatService.getConversationHistory(
                currentUser.getId(), otherUserId);
        return ResponseEntity.ok(history);
    }

    // ---- STOMP WebSocket Endpoint ----

    /**
     * Frontend sends message to: /app/chat.send
     * Payload: { receiverId: Long, content: String }
     * This method handles it and delivers to receiver's /user/queue/messages
     */
    @MessageMapping("/chat.send")
    public void sendMessageOverWebSocket(@Payload SendMessageRequest req,
                                         Principal principal) {
        // Principal is set during STOMP CONNECT by JwtChannelInterceptor
        // We extract sender from authenticated principal
        String senderEmail = principal.getName();
        // Look up user by email and send
        chatService.sendMessageByEmail(senderEmail, req.getReceiverId(), req.getContent());
    }
}
