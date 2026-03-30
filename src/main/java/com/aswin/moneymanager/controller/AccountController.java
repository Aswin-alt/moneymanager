package com.aswin.moneymanager.controller;

import com.aswin.moneymanager.dto.request.AccountRequest;
import com.aswin.moneymanager.dto.response.AccountResponse;
import com.aswin.moneymanager.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAccounts(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(accountService.getAccounts(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccount(userDetails.getUsername(), id));
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.createAccount(userDetails.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        accountService.deleteAccount(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
