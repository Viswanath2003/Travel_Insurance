package com.insurance.common.exception;

import org.springframework.http.HttpStatus;

public class ServiceCommunicationException extends PlatformException {

    public ServiceCommunicationException(String targetService, String message) {
        super(
            "Error communicating with " + targetService + ": " + message,
            "SERVICE_COMMUNICATION_ERROR",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
}
