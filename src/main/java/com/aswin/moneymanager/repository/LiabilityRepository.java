package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.Liability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LiabilityRepository extends JpaRepository<Liability, Long> {

    List<Liability> findByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(l.currentBalance), 0) FROM Liability l WHERE l.user.id = :userId")
    BigDecimal sumCurrentBalanceByUserId(@Param("userId") Long userId);
}
