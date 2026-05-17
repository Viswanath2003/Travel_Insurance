package com.insurance.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class PlatformException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    public PlatformException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public PlatformException(String message, String errorCode, HttpStatus httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
}
