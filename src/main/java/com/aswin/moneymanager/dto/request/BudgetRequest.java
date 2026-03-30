package com.aswin.moneymanager.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotBlank(message = "Month/year is required")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Month/year must be in YYYY-MM format (e.g. 2026-03)")
    private String monthYear;

    @NotNull(message = "Limit amount is required")
    @DecimalMin(value = "0.01", message = "Limit amount must be greater than zero")
    private BigDecimal limitAmount;

    @Size(min = 3, max = 3)
    private String currency = "USD";

    private Boolean alertAt80 = true;
    private Boolean alertAt100 = true;
}
