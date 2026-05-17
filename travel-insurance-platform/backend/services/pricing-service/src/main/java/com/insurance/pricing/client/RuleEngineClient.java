package com.insurance.pricing.client;

import com.insurance.common.exception.ServiceCommunicationException;
import com.insurance.pricing.client.dto.RuleEvaluationRequest;
import com.insurance.pricing.client.dto.RuleEvaluationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class RuleEngineClient {

    private final RestTemplate restTemplate;

    @Value("${app.services.rule-engine-url}")
    private String ruleEngineUrl;

    public RuleEvaluationResponse evaluate(RuleEvaluationRequest request) {
        String url = ruleEngineUrl + "/api/v1/rules/evaluate";
        try {
            ResponseEntity<RuleEvaluationResponse> response =
                    restTemplate.postForEntity(url, request, RuleEvaluationResponse.class);
            return response.getBody();
        } catch (RestClientException ex) {
            log.error("Rule engine call failed: {}", ex.getMessage());
            throw new ServiceCommunicationException("rule-engine-service", ex.getMessage());
        }
    }
}
