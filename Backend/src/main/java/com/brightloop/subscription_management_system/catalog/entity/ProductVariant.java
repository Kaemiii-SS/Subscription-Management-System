package com.brightloop.subscription_management_system.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(
        name = "product_variants",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"product_id", "attribute", "value"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 60)
    private String attribute;

    @Column(nullable = false, length = 60)
    private String value;

    @Column(name = "extra_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal extraPrice = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean active = true;
}