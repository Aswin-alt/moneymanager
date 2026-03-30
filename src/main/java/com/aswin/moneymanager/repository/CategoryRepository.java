package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.Category;
import com.aswin.moneymanager.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.user IS NULL) ORDER BY c.sortOrder")
    List<Category> findByUserIdOrSystem(@Param("userId") Long userId);

    List<Category> findByUserIdAndCategoryType(Long userId, CategoryType type);

    List<Category> findByIsSystemTrue();
}
