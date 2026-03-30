package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.SharedWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SharedWalletRepository extends JpaRepository<SharedWallet, Long> {

    List<SharedWallet> findByCreatedById(Long userId);

    @Query("SELECT sw FROM SharedWallet sw JOIN SharedWalletMember m ON m.wallet = sw WHERE m.user.id = :userId")
    List<SharedWallet> findAllByMemberUserId(@Param("userId") Long userId);
}
