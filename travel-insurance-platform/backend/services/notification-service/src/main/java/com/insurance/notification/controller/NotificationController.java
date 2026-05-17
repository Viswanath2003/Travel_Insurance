package com.insurance.notification.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.notification.dto.request.SendNotificationRequest;
import com.insurance.notification.entity.Notification;
import com.insurance.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app and email notification management")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    @Operation(summary = "Get current user's notifications")
    public ResponseEntity<ApiResponse<PagedResponse<Notification>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getMyNotifications(
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCount()));
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("All notifications marked as read").build());
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Notification marked as read").build());
    }

    @PostMapping("/internal/send")
    @Operation(summary = "Internal endpoint â€” send notification from another service")
    public ResponseEntity<ApiResponse<Void>> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        notificationService.send(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Notification queued").build());
    }
}

