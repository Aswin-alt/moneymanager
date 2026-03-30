package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.Transaction;
import com.aswin.moneymanager.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDate from, LocalDate to);

    List<Transaction> findByAccountIdAndTransactionDateBetween(
            Long accountId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId " +
           "AND t.category.id = :categoryId AND t.transactionDate BETWEEN :from AND :to " +
           "AND t.transactionType = 'EXPENSE'")
    BigDecimal sumExpenseByUserAndCategoryAndDateRange(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    List<Transaction> findByUserIdAndTransactionType(Long userId, TransactionType type);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND (:from IS NULL OR t.transactionDate >= :from) " +
           "AND (:to IS NULL OR t.transactionDate <= :to) " +
           "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
           "AND (:accountId IS NULL OR t.account.id = :accountId) " +
           "AND (:type IS NULL OR t.transactionType = :type) " +
           "AND (:search IS NULL OR LOWER(t.merchant) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Transaction> findByUserIdAndDateRangeAndFilters(
            @Param("userId") Long userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("categoryId") Long categoryId,
            @Param("accountId") Long accountId,
            @Param("type") TransactionType type,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
           "AND (:accountId IS NULL OR t.account.id = :accountId) " +
           "AND (:type IS NULL OR t.transactionType = :type) " +
           "AND (:search IS NULL OR LOWER(t.merchant) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Transaction> findByUserIdAndFilters(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("accountId") Long accountId,
            @Param("type") TransactionType type,
            @Param("search") String search,
            Pageable pageable);
}
