package com.aswin.moneymanager.service;

import com.aswin.moneymanager.dto.request.BudgetRequest;
import com.aswin.moneymanager.dto.response.BudgetSummaryResponse;
import com.aswin.moneymanager.entity.Budget;
import com.aswin.moneymanager.entity.Category;
import com.aswin.moneymanager.entity.User;
import com.aswin.moneymanager.enums.BudgetStatus;
import com.aswin.moneymanager.exception.BadRequestException;
import com.aswin.moneymanager.exception.DuplicateResourceException;
import com.aswin.moneymanager.exception.ResourceNotFoundException;
import com.aswin.moneymanager.repository.BudgetRepository;
import com.aswin.moneymanager.repository.CategoryRepository;
import com.aswin.moneymanager.repository.TransactionRepository;
import com.aswin.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @Cacheable(cacheNames = "budget_summary", key = "#email + ':' + #monthYear")
    public List<BudgetSummaryResponse> getBudgetSummary(String email, String monthYear) {
        User user = findUser(email);
        LocalDate start = LocalDate.parse(monthYear + "-01");
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        return budgetRepository.findByUserIdAndMonthYear(user.getId(), monthYear)
                .stream()
                .map(budget -> buildSummary(budget, user.getId(), start, end))
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = "budget_summary", allEntries = true)
    public BudgetSummaryResponse createBudget(String email, BudgetRequest request) {
        User user = findUser(email);

        if (budgetRepository.existsByUserIdAndCategoryIdAndMonthYear(
                user.getId(), request.getCategoryId(), request.getMonthYear())) {
            throw new DuplicateResourceException(
                    "A budget already exists for this category in " + request.getMonthYear());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Budget budget = Budget.builder()
                .user(user)
                .category(category)
                .monthYear(request.getMonthYear())
                .limitAmount(request.getLimitAmount())
                .currency(request.getCurrency() != null ? request.getCurrency().toUpperCase() : "USD")
                .alertAt80(request.getAlertAt80() != null ? request.getAlertAt80() : true)
                .alertAt100(request.getAlertAt100() != null ? request.getAlertAt100() : true)
                .build();

        Budget saved = budgetRepository.save(budget);
        LocalDate start = LocalDate.parse(request.getMonthYear() + "-01");
        return buildSummary(saved, user.getId(), start, start.withDayOfMonth(start.lengthOfMonth()));
    }

    @Transactional
    @CacheEvict(cacheNames = "budget_summary", allEntries = true)
    public BudgetSummaryResponse updateBudget(String email, Long budgetId, BudgetRequest request) {
        Budget budget = findOwnedBudget(email, budgetId);

        // If changing category/month, ensure no duplicate
        if (!budget.getCategory().getId().equals(request.getCategoryId())
                || !budget.getMonthYear().equals(request.getMonthYear())) {
            if (budgetRepository.existsByUserIdAndCategoryIdAndMonthYear(
                    budget.getUser().getId(), request.getCategoryId(), request.getMonthYear())) {
                throw new DuplicateResourceException(
                        "A budget already exists for this category in " + request.getMonthYear());
            }
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            budget.setCategory(category);
            budget.setMonthYear(request.getMonthYear());
        }

        budget.setLimitAmount(request.getLimitAmount());
        if (request.getCurrency() != null) budget.setCurrency(request.getCurrency().toUpperCase());
        if (request.getAlertAt80() != null) budget.setAlertAt80(request.getAlertAt80());
        if (request.getAlertAt100() != null) budget.setAlertAt100(request.getAlertAt100());

        Budget saved = budgetRepository.save(budget);
        LocalDate start = LocalDate.parse(saved.getMonthYear() + "-01");
        return buildSummary(saved, budget.getUser().getId(), start, start.withDayOfMonth(start.lengthOfMonth()));
    }

    @Transactional
    @CacheEvict(cacheNames = "budget_summary", allEntries = true)
    public void deleteBudget(String email, Long budgetId) {
        Budget budget = findOwnedBudget(email, budgetId);
        budgetRepository.delete(budget);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private BudgetSummaryResponse buildSummary(Budget budget, Long userId, LocalDate start, LocalDate end) {
        BigDecimal spent = transactionRepository.sumExpenseByUserAndCategoryAndDateRange(
                userId, budget.getCategory().getId(), start, end);
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal remaining = budget.getLimitAmount().subtract(spent);
        double pct = budget.getLimitAmount().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : spent.divide(budget.getLimitAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue();

        BudgetStatus status;
        if (pct >= 100) status = BudgetStatus.OVER;
        else if (pct >= 80) status = BudgetStatus.NEAR;
        else status = BudgetStatus.UNDER;

        return BudgetSummaryResponse.builder()
                .budgetId(budget.getId())
                .categoryId(budget.getCategory().getId())
                .categoryName(budget.getCategory().getName())
                .categoryIcon(budget.getCategory().getIcon())
                .categoryColor(budget.getCategory().getColor())
                .monthYear(budget.getMonthYear())
                .limitAmount(budget.getLimitAmount())
                .spentAmount(spent)
                .remainingAmount(remaining)
                .percentUsed(Math.round(pct * 10.0) / 10.0)
                .currency(budget.getCurrency())
                .status(status)
                .build();
    }

    private Budget findOwnedBudget(String email, Long budgetId) {
        User user = findUser(email);
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        if (!budget.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Budget not found");
        }
        return budget;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
