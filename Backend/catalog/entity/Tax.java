package com.brightloop.subscription_management_system.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "taxes")
@Getter
@Setter
@NoArgsConstructor
public class Tax {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal percent;

    @Column(nullable = false)
    private Boolean active = true;
}