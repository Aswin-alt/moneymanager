package com.aswin.moneymanager.dto.response;

import com.aswin.moneymanager.enums.BudgetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryResponse {
    private Long budgetId;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private String monthYear;
    private BigDecimal limitAmount;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private Double percentUsed;
    private String currency;
    private BudgetStatus status;
}
