package com.aswin.moneymanager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "net_worth_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetWorthSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "cash_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cashTotal = BigDecimal.ZERO;

    @Column(name = "investment_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal investmentTotal = BigDecimal.ZERO;

    @Column(name = "crypto_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cryptoTotal = BigDecimal.ZERO;

    @Column(name = "property_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal propertyTotal = BigDecimal.ZERO;

    @Column(name = "total_assets", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAssets;

    @Column(name = "total_liabilities", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalLiabilities;

    @Column(name = "net_worth", nullable = false, precision = 15, scale = 2)
    private BigDecimal netWorth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
