package com.insurance.common.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends PlatformException {

    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
    }
}
