package com.insurance.gateway.filter;

import com.insurance.common.security.JwtTokenProvider;
import com.insurance.gateway.config.GatewayRoutingConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProxyFilter extends OncePerRequestFilter {

    private final GatewayRoutingConfig routingConfig;
    private final RestTemplate restTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String targetUrl = resolveTarget(path);

        if (targetUrl == null) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write("{\"error\":\"No route found for: " + path + "\"}");
            return;
        }

        try {
            String queryString = request.getQueryString();
            String fullUrl = targetUrl + path + (queryString != null ? "?" + queryString : "");

            HttpHeaders headers = new HttpHeaders();
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (!"host".equalsIgnoreCase(headerName)) {
                    headers.add(headerName, request.getHeader(headerName));
                }
            }

            byte[] body = StreamUtils.copyToByteArray(request.getInputStream());
            HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);

            ResponseEntity<byte[]> upstream = restTemplate.exchange(
                    new URI(fullUrl),
                    HttpMethod.valueOf(request.getMethod()),
                    entity,
                    byte[].class
            );

            response.setStatus(upstream.getStatusCode().value());
            upstream.getHeaders().forEach((name, values) -> {
                if (!"transfer-encoding".equalsIgnoreCase(name)) {
                    values.forEach(val -> response.addHeader(name, val));
                }
            });
            if (upstream.getBody() != null) {
                response.getOutputStream().write(upstream.getBody());
            }

        } catch (HttpStatusCodeException e) {
            response.setStatus(e.getStatusCode().value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(e.getResponseBodyAsString());
        } catch (URISyntaxException e) {
            log.error("URI error: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String resolveTarget(String path) {
        if (routingConfig.getRoutes() == null) return null;
        return routingConfig.getRoutes().entrySet().stream()
                .filter(e -> path.startsWith(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui");
    }
}
