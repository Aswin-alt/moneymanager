package com.aswin.moneymanager.dto.response;

import com.aswin.moneymanager.enums.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
    private Long id;
    private String name;
    private AccountType accountType;
    private String currency;
    private BigDecimal balance;
    private String institution;
    private String accountNumberMasked;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
