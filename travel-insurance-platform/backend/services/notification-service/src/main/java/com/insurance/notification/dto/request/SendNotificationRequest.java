package com.insurance.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class SendNotificationRequest {

    @NotBlank(message = "Recipient ID is required")
    private String recipientId;

    @NotBlank(message = "Recipient email is required for EMAIL channel")
    private String recipientEmail;

    @NotBlank(message = "Event code is required")
    private String eventCode;

    @NotNull(message = "Template variables are required")
    private Map<String, Object> variables;

    private String entityType;
    private String entityId;
}
