package com.aswin.moneymanager.controller;

import com.aswin.moneymanager.dto.request.CategoryRequest;
import com.aswin.moneymanager.dto.response.CategoryResponse;
import com.aswin.moneymanager.enums.CategoryType;
import com.aswin.moneymanager.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) CategoryType type) {
        if (type != null) {
            return ResponseEntity.ok(categoryService.getCategoriesByType(userDetails.getUsername(), type));
        }
        return ResponseEntity.ok(categoryService.getCategories(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategory(userDetails.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        categoryService.deleteCategory(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
