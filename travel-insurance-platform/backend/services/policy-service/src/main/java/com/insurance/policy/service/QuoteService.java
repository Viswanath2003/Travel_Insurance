package com.insurance.policy.service;

import com.insurance.policy.dto.request.CreateQuoteRequest;
import com.insurance.policy.dto.response.QuoteResponse;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface QuoteService {

    QuoteResponse createQuote(CreateQuoteRequest request);

    QuoteResponse getQuoteById(String quoteId);

    QuoteResponse getQuoteByReference(String quoteReference);

    PagedResponse<QuoteResponse> getMyQuotes(Pageable pageable);

    QuoteResponse recalculateQuote(String quoteId, CreateQuoteRequest request);
}
