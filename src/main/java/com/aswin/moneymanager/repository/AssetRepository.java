package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(a.currentValue), 0) FROM Asset a WHERE a.user.id = :userId")
    BigDecimal sumCurrentValueByUserId(@Param("userId") Long userId);
}
