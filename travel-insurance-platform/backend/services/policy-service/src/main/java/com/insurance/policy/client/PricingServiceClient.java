package com.insurance.policy.client;

import com.insurance.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PricingServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.pricing.url:http://localhost:8086}")
    private String pricingServiceUrl;

    public Map<String, Object> calculatePremium(Map<String, Object> request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
                    pricingServiceUrl + "/api/v1/pricing/calculate",
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null
                    && response.getBody().getData() != null) {
                return response.getBody().getData();
            }
            throw new RuntimeException("Pricing service returned empty response");
        } catch (Exception e) {
            log.error("Failed to call pricing service: {}", e.getMessage());
            throw new com.insurance.common.exception.ServiceCommunicationException("pricing-service", e.getMessage());
        }
    }
}
