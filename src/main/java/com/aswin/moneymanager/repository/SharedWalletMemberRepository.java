package com.aswin.moneymanager.repository;

import com.aswin.moneymanager.entity.SharedWalletMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedWalletMemberRepository extends JpaRepository<SharedWalletMember, Long> {

    List<SharedWalletMember> findByWalletId(Long walletId);

    Optional<SharedWalletMember> findByWalletIdAndUserId(Long walletId, Long userId);

    boolean existsByWalletIdAndUserId(Long walletId, Long userId);
}
