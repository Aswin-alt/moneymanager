package com.aswin.moneymanager.dto.request;

import com.aswin.moneymanager.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountRequest {

    @NotBlank(message = "Account name is required")
    @Size(max = 100, message = "Account name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code (e.g. USD)")
    private String currency = "USD";

    private BigDecimal initialBalance = BigDecimal.ZERO;

    @Size(max = 100)
    private String institution;

    @Size(max = 20)
    private String accountNumberMasked;
}
