package com.aswin.moneymanager.service;

import com.aswin.moneymanager.dto.request.CategoryRequest;
import com.aswin.moneymanager.dto.response.CategoryResponse;
import com.aswin.moneymanager.entity.Category;
import com.aswin.moneymanager.entity.User;
import com.aswin.moneymanager.enums.CategoryType;
import com.aswin.moneymanager.exception.BadRequestException;
import com.aswin.moneymanager.exception.ResourceNotFoundException;
import com.aswin.moneymanager.repository.CategoryRepository;
import com.aswin.moneymanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Cacheable(cacheNames = "categories", key = "#email")
    public List<CategoryResponse> getCategories(String email) {
        User user = findUser(email);
        return categoryRepository.findByUserIdOrSystem(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public List<CategoryResponse> getCategoriesByType(String email, CategoryType type) {
        User user = findUser(email);
        return categoryRepository.findByUserIdOrSystemAndType(user.getId(), type)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = "categories", key = "#email")
    public CategoryResponse createCategory(String email, CategoryRequest request) {
        User user = findUser(email);

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
        }

        Category category = Category.builder()
                .user(user)
                .name(request.getName())
                .icon(request.getIcon() != null ? request.getIcon() : "📦")
                .color(request.getColor() != null ? request.getColor() : "#6B7280")
                .categoryType(request.getCategoryType())
                .parent(parent)
                .isSystem(false)
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(cacheNames = "categories", key = "#email")
    public CategoryResponse updateCategory(String email, Long categoryId, CategoryRequest request) {
        Category category = findOwnedCategory(email, categoryId);

        category.setName(request.getName());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getColor() != null) category.setColor(request.getColor());

        if (request.getParentId() != null) {
            if (request.getParentId().equals(categoryId)) {
                throw new BadRequestException("A category cannot be its own parent");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(cacheNames = "categories", key = "#email")
    public void deleteCategory(String email, Long categoryId) {
        Category category = findOwnedCategory(email, categoryId);
        categoryRepository.delete(category);
    }

    private Category findOwnedCategory(String email, Long categoryId) {
        User user = findUser(email);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (Boolean.TRUE.equals(category.getIsSystem())) {
            throw new BadRequestException("System categories cannot be modified");
        }
        if (category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Category not found");
        }
        return category;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .categoryType(category.getCategoryType())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .isSystem(category.getIsSystem())
                .sortOrder(category.getSortOrder())
                .build();
    }
}
