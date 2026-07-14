package com.alaya.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotNull public Long receiverId;
    public String content;
    public String attachmentUrl;
    public String attachmentType;
    public String attachmentName;
}
