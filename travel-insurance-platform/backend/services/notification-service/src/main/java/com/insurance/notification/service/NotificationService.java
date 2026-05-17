package com.insurance.notification.service;

import com.insurance.notification.dto.request.SendNotificationRequest;
import com.insurance.notification.entity.Notification;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    void send(SendNotificationRequest request);

    PagedResponse<Notification> getMyNotifications(Pageable pageable);

    long getUnreadCount();

    void markAllAsRead();

    void markAsRead(String notificationId);
}
