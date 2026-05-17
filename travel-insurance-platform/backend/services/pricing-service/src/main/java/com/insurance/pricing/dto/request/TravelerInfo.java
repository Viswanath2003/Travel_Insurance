package com.insurance.pricing.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelerInfo {

    @NotNull
    @Min(0)
    @Max(120)
    private Integer age;

    private boolean primary = false;
}
