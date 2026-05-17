package com.insurance.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public final class DateUtils {

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private DateUtils() {}

    public static long daysBetween(LocalDate from, LocalDate to) {
        return ChronoUnit.DAYS.between(from, to);
    }

    public static LocalDateTime nowUtc() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    public static LocalDate today() {
        return LocalDate.now();
    }

    public static String formatDisplay(LocalDate date) {
        return date != null ? date.format(DISPLAY_DATE) : "";
    }

    public static String formatIso(LocalDate date) {
        return date != null ? date.format(ISO_DATE) : "";
    }

    public static boolean isExpired(LocalDateTime expiryTime) {
        return LocalDateTime.now(ZoneOffset.UTC).isAfter(expiryTime);
    }

    public static boolean isDateInFuture(LocalDate date) {
        return date.isAfter(LocalDate.now());
    }

    public static boolean isDateInPast(LocalDate date) {
        return date.isBefore(LocalDate.now());
    }
}
