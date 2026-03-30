package com.aswin.moneymanager.dto.response;

import com.aswin.moneymanager.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private Long accountId;
    private String accountName;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private BigDecimal amount;
    private String currency;
    private BigDecimal convertedAmount;
    private TransactionType transactionType;
    private String merchant;
    private String description;
    private LocalDate transactionDate;
    private Boolean isRecurring;
    private Boolean isAutoCategorized;
    private String tags;
    private LocalDateTime createdAt;
}
