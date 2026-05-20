package com.alaya.dto;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private String email;
    private String otp;
}
