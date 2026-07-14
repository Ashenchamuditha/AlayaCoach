package com.alaya.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessageDto {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String attachmentUrl;
    private String attachmentType;
    private String attachmentName;
    private LocalDateTime timestamp;
    private boolean read;
}
