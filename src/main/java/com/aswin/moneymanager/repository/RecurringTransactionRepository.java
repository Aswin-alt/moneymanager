package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {

    List<RecurringTransaction> findByUserIdAndIsActiveTrue(Long userId);

    List<RecurringTransaction> findByUserIdAndNextDueDateBetweenAndIsActiveTrue(
            Long userId, LocalDate from, LocalDate to);
}
