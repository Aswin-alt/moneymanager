package com.aswin.moneymanager.service;

import com.aswin.moneymanager.dto.request.TransactionRequest;
import com.aswin.moneymanager.dto.response.PageResponse;
import com.aswin.moneymanager.dto.response.TransactionResponse;
import com.aswin.moneymanager.entity.Account;
import com.aswin.moneymanager.entity.Category;
import com.aswin.moneymanager.entity.Notification;
import com.aswin.moneymanager.entity.Transaction;
import com.aswin.moneymanager.entity.User;
import com.aswin.moneymanager.enums.NotificationType;
import com.aswin.moneymanager.enums.TransactionType;
import com.aswin.moneymanager.exception.BadRequestException;
import com.aswin.moneymanager.exception.ResourceNotFoundException;
import com.aswin.moneymanager.repository.AccountRepository;
import com.aswin.moneymanager.repository.BudgetRepository;
import com.aswin.moneymanager.repository.CategoryRepository;
import com.aswin.moneymanager.repository.NotificationRepository;
import com.aswin.moneymanager.repository.TransactionRepository;
import com.aswin.moneymanager.repository.UserRepository;
import com.aswin.moneymanager.service.currency.CurrencyConversionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;
    private final NotificationRepository notificationRepository;
    private final CurrencyConversionService currencyConversionService;

    public PageResponse<TransactionResponse> getTransactions(
            String email, int page, int size,
            LocalDate from, LocalDate to,
            Long categoryId, Long accountId,
            TransactionType type, String search) {

        User user = findUser(email);
        PageRequest pageRequest = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt"));

        Page<Transaction> txPage;
        if (from != null && to != null) {
            txPage = transactionRepository.findByUserIdAndDateRangeAndFilters(
                    user.getId(), from, to, categoryId, accountId, type, search, pageRequest);
        } else {
            txPage = transactionRepository.findByUserIdAndFilters(
                    user.getId(), categoryId, accountId, type, search, pageRequest);
        }

        return PageResponse.<TransactionResponse>builder()
                .content(txPage.getContent().stream().map(this::toResponse).toList())
                .page(txPage.getNumber())
                .size(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .last(txPage.isLast())
                .build();
    }

    public TransactionResponse getTransaction(String email, Long transactionId) {
        return toResponse(findOwnedTransaction(email, transactionId));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "budget_summary", allEntries = true),
        @CacheEvict(cacheNames = "report_spending", allEntries = true),
        @CacheEvict(cacheNames = "report_trend", allEntries = true),
        @CacheEvict(cacheNames = "safe_to_spend", allEntries = true)
    })
    public TransactionResponse createTransaction(String email, TransactionRequest request) {
        User user = findUser(email);
        Account account = findOwnedAccount(user, request.getAccountId());

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        // For TRANSFER: validate destination account
        if (request.getTransactionType() == TransactionType.TRANSFER) {
            if (request.getToAccountId() == null) {
                throw new BadRequestException("Destination account is required for TRANSFER");
            }
            if (request.getToAccountId().equals(request.getAccountId())) {
                throw new BadRequestException("Source and destination accounts must differ");
            }
        }

        String currency = request.getCurrency() != null
                ? request.getCurrency().toUpperCase() : account.getCurrency();

        BigDecimal convertedAmount = currencyConversionService.convert(
                request.getAmount(), currency, user.getDefaultCurrency());

        Transaction transaction = Transaction.builder()
                .user(user)
                .account(account)
                .category(category)
                .amount(request.getAmount())
                .currency(currency)
                .convertedAmount(convertedAmount)
                .transactionType(request.getTransactionType())
                .merchant(request.getMerchant())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .tags(request.getTags())
                .build();

        Transaction saved = transactionRepository.save(transaction);

        // Update account balances
        applyBalanceChange(account, request.getTransactionType(), request.getAmount(), true);

        if (request.getTransactionType() == TransactionType.TRANSFER) {
            Account toAccount = findOwnedAccount(user, request.getToAccountId());
            applyBalanceChange(toAccount, TransactionType.INCOME, request.getAmount(), true);
        }

        // Check budget thresholds for expense transactions
        if (request.getTransactionType() == TransactionType.EXPENSE && category != null) {
            checkBudgetThresholds(user, category, request.getTransactionDate());
        }

        return toResponse(saved);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "budget_summary", allEntries = true),
        @CacheEvict(cacheNames = "report_spending", allEntries = true),
        @CacheEvict(cacheNames = "report_trend", allEntries = true),
        @CacheEvict(cacheNames = "safe_to_spend", allEntries = true)
    })
    public TransactionResponse updateTransaction(String email, Long transactionId, TransactionRequest request) {
        Transaction existing = findOwnedTransaction(email, transactionId);
        User user = existing.getUser();
        Account account = existing.getAccount();

        // Reverse old balance effect
        applyBalanceChange(account, existing.getTransactionType(), existing.getAmount(), false);

        Account newAccount = account;
        if (!request.getAccountId().equals(account.getId())) {
            newAccount = findOwnedAccount(user, request.getAccountId());
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        String currency = request.getCurrency() != null
                ? request.getCurrency().toUpperCase() : newAccount.getCurrency();

        BigDecimal convertedAmount = currencyConversionService.convert(
                request.getAmount(), currency, user.getDefaultCurrency());

        existing.setAccount(newAccount);
        existing.setCategory(category);
        existing.setAmount(request.getAmount());
        existing.setCurrency(currency);
        existing.setConvertedAmount(convertedAmount);
        existing.setTransactionType(request.getTransactionType());
        existing.setMerchant(request.getMerchant());
        existing.setDescription(request.getDescription());
        existing.setTransactionDate(request.getTransactionDate());
        existing.setTags(request.getTags());

        Transaction saved = transactionRepository.save(existing);

        // Apply new balance effect
        applyBalanceChange(newAccount, request.getTransactionType(), request.getAmount(), true);

        return toResponse(saved);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "budget_summary", allEntries = true),
        @CacheEvict(cacheNames = "report_spending", allEntries = true),
        @CacheEvict(cacheNames = "report_trend", allEntries = true),
        @CacheEvict(cacheNames = "safe_to_spend", allEntries = true)
    })
    public void deleteTransaction(String email, Long transactionId) {
        Transaction transaction = findOwnedTransaction(email, transactionId);

        // Reverse the balance effect before deleting
        applyBalanceChange(transaction.getAccount(), transaction.getTransactionType(),
                transaction.getAmount(), false);

        transactionRepository.delete(transaction);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void applyBalanceChange(Account account, TransactionType type, BigDecimal amount, boolean apply) {
        BigDecimal delta = apply ? amount : amount.negate();
        BigDecimal balanceDelta = switch (type) {
            case INCOME  -> delta;
            case EXPENSE -> delta.negate();
            case TRANSFER -> delta.negate(); // deducted from source
        };
        account.setBalance(account.getBalance().add(balanceDelta));
        accountRepository.save(account);
    }

    private void checkBudgetThresholds(User user, Category category, LocalDate txDate) {
        String monthYear = txDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        budgetRepository.findByUserIdAndCategoryIdAndMonthYear(user.getId(), category.getId(), monthYear)
                .ifPresent(budget -> {
                    LocalDate start = LocalDate.parse(monthYear + "-01");
                    LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

                    BigDecimal spent = transactionRepository.sumExpenseByUserAndCategoryAndDateRange(
                            user.getId(), category.getId(), start, end);

                    double pct = spent.divide(budget.getLimitAmount(), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue();

                    if (Boolean.TRUE.equals(budget.getAlertAt100()) && pct >= 100) {
                        saveNotification(user, category.getName(), monthYear, pct, true);
                    } else if (Boolean.TRUE.equals(budget.getAlertAt80()) && pct >= 80) {
                        saveNotification(user, category.getName(), monthYear, pct, false);
                    }
                });
    }

    private void saveNotification(User user, String categoryName, String monthYear,
                                   double pct, boolean exceeded) {
        String title = exceeded
                ? "Budget Exceeded: " + categoryName
                : "Budget Warning: " + categoryName;
        String message = exceeded
                ? String.format("You have exceeded your %s budget for %s (%.0f%% used).",
                        categoryName, monthYear, pct)
                : String.format("You have used %.0f%% of your %s budget for %s.",
                        pct, categoryName, monthYear);

        Notification notification = Notification.builder()
                .user(user)
                .notificationType(exceeded ? NotificationType.BUDGET_EXCEEDED : NotificationType.BUDGET_WARNING)
                .title(title)
                .message(message)
                .referenceType("BUDGET")
                .build();
        notificationRepository.save(notification);
        log.info("Budget alert saved for user {} category {} at {:.0f}%", user.getId(), categoryName, pct);
    }

    private Transaction findOwnedTransaction(String email, Long transactionId) {
        User user = findUser(email);
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        if (!tx.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Transaction not found");
        }
        return tx;
    }

    private Account findOwnedAccount(User user, Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));
        if (!account.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Account not found: " + accountId);
        }
        return account;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .accountId(tx.getAccount().getId())
                .accountName(tx.getAccount().getName())
                .categoryId(tx.getCategory() != null ? tx.getCategory().getId() : null)
                .categoryName(tx.getCategory() != null ? tx.getCategory().getName() : null)
                .categoryIcon(tx.getCategory() != null ? tx.getCategory().getIcon() : null)
                .categoryColor(tx.getCategory() != null ? tx.getCategory().getColor() : null)
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .convertedAmount(tx.getConvertedAmount())
                .transactionType(tx.getTransactionType())
                .merchant(tx.getMerchant())
                .description(tx.getDescription())
                .transactionDate(tx.getTransactionDate())
                .isRecurring(tx.getIsRecurring())
                .isAutoCategorized(tx.getIsAutoCategorized())
                .tags(tx.getTags())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
