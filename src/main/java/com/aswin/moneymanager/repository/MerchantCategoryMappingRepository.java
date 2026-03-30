package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.MerchantCategoryMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MerchantCategoryMappingRepository extends JpaRepository<MerchantCategoryMapping, Long> {

    @Query("SELECT m FROM MerchantCategoryMapping m WHERE (m.user.id = :userId OR m.user IS NULL) " +
           "ORDER BY m.confidence DESC, m.usageCount DESC")
    List<MerchantCategoryMapping> findByUserIdOrGlobal(@Param("userId") Long userId);
}
