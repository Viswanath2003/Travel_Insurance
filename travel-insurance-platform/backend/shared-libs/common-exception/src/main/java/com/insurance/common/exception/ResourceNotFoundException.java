package com.insurance.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends PlatformException {

    public ResourceNotFoundException(String resource, String identifier) {
        super(
            resource + " not found: " + identifier,
            "RESOURCE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
    }
}
