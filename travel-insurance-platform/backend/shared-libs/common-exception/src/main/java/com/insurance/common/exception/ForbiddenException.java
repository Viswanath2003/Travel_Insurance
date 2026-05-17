package com.insurance.common.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends PlatformException {

    public ForbiddenException(String message) {
        super(message, "FORBIDDEN", HttpStatus.FORBIDDEN);
    }
}
