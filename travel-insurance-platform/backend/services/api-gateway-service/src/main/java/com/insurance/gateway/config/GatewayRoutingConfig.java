package com.insurance.gateway.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "gateway")
public class GatewayRoutingConfig {

    private Map<String, String> routes;

    /**
     * Route prefix to downstream service URL mapping.
     * e.g. /api/v1/auth -> http://localhost:8081
     *      /api/v1/policies -> http://localhost:8084
     */
}
