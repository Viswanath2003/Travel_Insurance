package com.insurance.notification.service.impl;

import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.SecurityUtils;
import com.insurance.notification.dto.request.SendNotificationRequest;
import com.insurance.notification.entity.Notification;
import com.insurance.notification.entity.NotificationTemplate;
import com.insurance.notification.repository.NotificationRepository;
import com.insurance.notification.repository.NotificationTemplateRepository;
import com.insurance.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{(\\w+)\\}\\}");

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final JavaMailSender mailSender;

    @Override
    @Async
    @Transactional
    public void send(SendNotificationRequest request) {
        NotificationTemplate template = templateRepository
                .findByEventCodeAndActiveTrue(request.getEventCode())
                .orElseGet(() -> {
                    log.warn("No active template found for event: {}", request.getEventCode());
                    return null;
                });

        if (template == null) return;

        String title = resolve(template.getTitleTemplate(), request.getVariables());
        String body = resolve(template.getBodyTemplate(), request.getVariables());

        Arrays.stream(template.getChannels().split(",")).map(String::trim).forEach(channel -> {
            Notification notification = new Notification();
            notification.setRecipientId(request.getRecipientId());
            notification.setEventCode(request.getEventCode());
            notification.setTitle(title);
            notification.setBody(body);
            notification.setChannel(channel);
            notification.setEntityType(request.getEntityType());
            notification.setEntityId(request.getEntityId());

            if ("EMAIL".equals(channel)) {
                sendEmail(request.getRecipientEmail(), title, body, notification);
            }

            notificationRepository.save(notification);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<Notification> getMyNotifications(Pageable pageable) {
        String userId = SecurityUtils.getCurrentUserId();
        Page<Notification> page = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        return PagedResponse.of(page);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByRecipientIdAndReadFalse(SecurityUtils.getCurrentUserId());
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsRead(SecurityUtils.getCurrentUserId(), LocalDateTime.now());
    }

    @Override
    @Transactional
    public void markAsRead(String notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        n.setRead(true);
        n.setReadAt(LocalDateTime.now());
    }

    private void sendEmail(String to, String subject, String body, Notification notification) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            notification.setDeliveryStatus("SENT");
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            notification.setDeliveryStatus("FAILED");
        }
    }

    private String resolve(String template, Map<String, Object> variables) {
        Matcher matcher = PLACEHOLDER.matcher(template);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = variables.get(key);
            matcher.appendReplacement(result, Matcher.quoteReplacement(value != null ? value.toString() : ""));
        }
        matcher.appendTail(result);
        return result.toString();
    }
}
