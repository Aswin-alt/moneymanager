package com.aswin.moneymanager.dto.request;

import com.aswin.moneymanager.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 50, message = "Category name must not exceed 50 characters")
    private String name;

    @Size(max = 50)
    private String icon = "📦";

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex code (e.g. #6B7280)")
    private String color = "#6B7280";

    @NotNull(message = "Category type is required")
    private CategoryType categoryType;

    private Long parentId;
}
