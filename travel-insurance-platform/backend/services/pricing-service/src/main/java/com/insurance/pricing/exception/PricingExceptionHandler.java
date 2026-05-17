package com.insurance.pricing.exception;

import com.insurance.common.exception.GlobalExceptionHandlerBase;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Hidden
@RestControllerAdvice
public class PricingExceptionHandler extends GlobalExceptionHandlerBase {
}
