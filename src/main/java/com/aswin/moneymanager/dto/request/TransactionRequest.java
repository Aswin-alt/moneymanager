package com.aswin.moneymanager.dto.request;

import com.aswin.moneymanager.enums.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionRequest {

    @NotNull(message = "Account ID is required")
    private Long accountId;

    private Long categoryId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code (e.g. USD)")
    private String currency = "USD";

    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    @Size(max = 200)
    private String merchant;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    // For TRANSFER type: destination account
    private Long toAccountId;

    @Pattern(regexp = "^(\\[.*\\])?$", message = "Tags must be a valid JSON array")
    private String tags;
}
