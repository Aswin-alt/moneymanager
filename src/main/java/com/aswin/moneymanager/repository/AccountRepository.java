package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.Account;
import com.aswin.moneymanager.enums.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUserIdAndIsActiveTrue(Long userId);

    List<Account> findByUserIdAndAccountType(Long userId, AccountType accountType);

    boolean existsByUserIdAndName(Long userId, String name);
}
