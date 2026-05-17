package com.insurance.common.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

public final class ReferenceNumberGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String ALPHA_NUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private ReferenceNumberGenerator() {}

    /** Generates: QT-20250107-A3X9K2 */
    public static String generateQuoteReference() {
        return "QT-" + today() + "-" + randomAlphaNum(6);
    }

    /** Generates: POL-20250107-A3X9K2 */
    public static String generatePolicyNumber() {
        return "POL-" + today() + "-" + randomAlphaNum(6);
    }

    /** Generates: CLM-20250107-A3X9K2 */
    public static String generateClaimReference() {
        return "CLM-" + today() + "-" + randomAlphaNum(6);
    }

    /** Generates: UWC-20250107-A3X9K2 */
    public static String generateUwCaseReference() {
        return "UWC-" + today() + "-" + randomAlphaNum(6);
    }

    /** Generates: FLD-20250107-A3X9K2 */
    public static String generateFieldAssignmentReference() {
        return "FLD-" + today() + "-" + randomAlphaNum(6);
    }

    /** Generates a 6-digit numeric OTP */
    public static String generateOtp() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }

    private static String today() {
        return LocalDate.now().format(DATE_FMT);
    }

    private static String randomAlphaNum(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHA_NUM.charAt(ThreadLocalRandom.current().nextInt(ALPHA_NUM.length())));
        }
        return sb.toString();
    }
}
