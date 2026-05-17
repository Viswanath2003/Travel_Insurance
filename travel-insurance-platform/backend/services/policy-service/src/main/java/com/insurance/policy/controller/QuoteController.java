package com.insurance.policy.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.policy.dto.request.CreateQuoteRequest;
import com.insurance.policy.dto.response.QuoteResponse;
import com.insurance.policy.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/quotes")
@RequiredArgsConstructor
@Tag(name = "Quotes", description = "Quote creation and management")
public class QuoteController {

    private final QuoteService quoteService;

    @PostMapping
    @PreAuthorize("hasAuthority('" + PermissionConstants.QUOTE_CREATE + "')")
    @Operation(summary = "Create a new insurance quote")
    public ResponseEntity<ApiResponse<QuoteResponse>> createQuote(@Valid @RequestBody CreateQuoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(quoteService.createQuote(request)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('" + PermissionConstants.QUOTE_VIEW + "')")
    @Operation(summary = "Get current user's quotes")
    public ResponseEntity<ApiResponse<PagedResponse<QuoteResponse>>> getMyQuotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                quoteService.getMyQuotes(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{quoteId}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.QUOTE_VIEW + "')")
    @Operation(summary = "Get quote by ID")
    public ResponseEntity<ApiResponse<QuoteResponse>> getQuoteById(@PathVariable String quoteId) {
        return ResponseEntity.ok(ApiResponse.ok(quoteService.getQuoteById(quoteId)));
    }

    @PutMapping("/{quoteId}/recalculate")
    @PreAuthorize("hasAuthority('" + PermissionConstants.QUOTE_CREATE + "')")
    @Operation(summary = "Recalculate quote with updated coverage selections")
    public ResponseEntity<ApiResponse<QuoteResponse>> recalculate(
            @PathVariable String quoteId,
            @Valid @RequestBody CreateQuoteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(quoteService.recalculateQuote(quoteId, request)));
    }
}
