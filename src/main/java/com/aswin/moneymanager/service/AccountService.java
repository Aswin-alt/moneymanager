package com.aswin.moneymanager.service;

import com.aswin.moneymanager.dto.request.AccountRequest;
import com.aswin.moneymanager.dto.response.AccountResponse;
import com.aswin.moneymanager.entity.Account;
import com.aswin.moneymanager.entity.User;
import com.aswin.moneymanager.exception.BadRequestException;
import com.aswin.moneymanager.exception.ResourceNotFoundException;
import com.aswin.moneymanager.repository.AccountRepository;
import com.aswin.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public List<AccountResponse> getAccounts(String email) {
        User user = findUser(email);
        return accountRepository.findByUserIdAndIsActiveTrue(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public AccountResponse getAccount(String email, Long accountId) {
        return toResponse(findOwnedAccount(email, accountId));
    }

    @Transactional
    @CacheEvict(cacheNames = "user_prefs", key = "#email")
    public AccountResponse createAccount(String email, AccountRequest request) {
        User user = findUser(email);

        if (accountRepository.existsByUserIdAndName(user.getId(), request.getName())) {
            throw new BadRequestException("An account with this name already exists");
        }

        Account account = Account.builder()
                .user(user)
                .name(request.getName())
                .accountType(request.getAccountType())
                .currency(request.getCurrency() != null ? request.getCurrency().toUpperCase() : "USD")
                .balance(request.getInitialBalance() != null ? request.getInitialBalance() : java.math.BigDecimal.ZERO)
                .institution(request.getInstitution())
                .accountNumberMasked(request.getAccountNumberMasked())
                .build();

        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse updateAccount(String email, Long accountId, AccountRequest request) {
        Account account = findOwnedAccount(email, accountId);

        account.setName(request.getName());
        account.setAccountType(request.getAccountType());
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency().toUpperCase());
        }
        if (request.getInstitution() != null) {
            account.setInstitution(request.getInstitution());
        }
        if (request.getAccountNumberMasked() != null) {
            account.setAccountNumberMasked(request.getAccountNumberMasked());
        }

        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public void deleteAccount(String email, Long accountId) {
        Account account = findOwnedAccount(email, accountId);
        account.setIsActive(false);
        accountRepository.save(account);
    }

    // Called internally by TransactionService after transaction changes
    @Transactional
    public void adjustBalance(Long accountId, java.math.BigDecimal delta) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));
        account.setBalance(account.getBalance().add(delta));
        accountRepository.save(account);
    }

    private Account findOwnedAccount(String email, Long accountId) {
        User user = findUser(email);
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!account.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Account not found");
        }
        return account;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .accountType(account.getAccountType())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .institution(account.getInstitution())
                .accountNumberMasked(account.getAccountNumberMasked())
                .isActive(account.getIsActive())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
