package com.aswin.moneymanager.controller;

import com.aswin.moneymanager.dto.request.BudgetRequest;
import com.aswin.moneymanager.dto.response.BudgetSummaryResponse;
import com.aswin.moneymanager.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetSummaryResponse>> getBudgets(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String month) {
        String monthYear = month != null ? month
                : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return ResponseEntity.ok(budgetService.getBudgetSummary(userDetails.getUsername(), monthYear));
    }

    @PostMapping
    public ResponseEntity<BudgetSummaryResponse> createBudget(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(budgetService.createBudget(userDetails.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetSummaryResponse> updateBudget(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.updateBudget(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        budgetService.deleteBudget(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
