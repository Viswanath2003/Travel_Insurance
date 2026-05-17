package com.insurance.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Optional;

@Slf4j
public final class JsonUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private JsonUtils() {}

    public static String toJson(Object object) {
        try {
            return MAPPER.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize object to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    public static <T> Optional<T> fromJson(String json, Class<T> clazz) {
        try {
            return Optional.of(MAPPER.readValue(json, clazz));
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize JSON to {}: {}", clazz.getSimpleName(), e.getMessage());
            return Optional.empty();
        }
    }

    public static <T> Optional<T> fromJson(String json, TypeReference<T> typeRef) {
        try {
            return Optional.of(MAPPER.readValue(json, typeRef));
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize JSON: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public static Map<String, Object> toMap(Object object) {
        return MAPPER.convertValue(object, new TypeReference<Map<String, Object>>() {});
    }

    public static ObjectMapper getMapper() {
        return MAPPER;
    }
}
