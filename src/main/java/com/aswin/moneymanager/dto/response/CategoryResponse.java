package com.aswin.moneymanager.dto.response;

import com.aswin.moneymanager.enums.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private String color;
    private CategoryType categoryType;
    private Long parentId;
    private String parentName;
    private Boolean isSystem;
    private Integer sortOrder;
}
