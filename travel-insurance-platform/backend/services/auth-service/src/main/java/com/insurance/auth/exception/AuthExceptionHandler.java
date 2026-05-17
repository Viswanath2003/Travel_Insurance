package com.insurance.auth.exception;

import com.insurance.common.exception.GlobalExceptionHandlerBase;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler extends GlobalExceptionHandlerBase {
    // Inherits all handlers from GlobalExceptionHandlerBase
    // Add auth-service-specific overrides here if needed
}
