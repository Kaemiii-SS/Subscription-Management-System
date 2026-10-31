package com.brightloop.subscription_management_system.subscription.entity;

import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String number;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private QuotationTemplate template;

    @Column(name = "status", nullable = false, length = 10)
    private String status = "DRAFT";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "payment_terms_days", nullable = false)
    private Integer paymentTermsDays = 0;

    @Column(name = "quote_valid_until")
    private LocalDate quoteValidUntil;

    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "activated_at")
    private OffsetDateTime activatedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Version
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(
            mappedBy = "subscription",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<SubscriptionLine> lines = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void addLine(SubscriptionLine line) {
        lines.add(line);
        line.setSubscription(this);
    }

    public void clearLines() {
        lines.clear();
    }


    public void transitionTo(String nextStatus) {
        boolean allowed = switch (this.status) {
            case "DRAFT" -> "QUOTATION".equals(nextStatus) || "CONFIRMED".equals(nextStatus) || "ACTIVE".equals(nextStatus);
            case "QUOTATION" -> "CONFIRMED".equals(nextStatus) || "ACTIVE".equals(nextStatus);
            case "CONFIRMED" -> "ACTIVE".equals(nextStatus);
            case "ACTIVE" -> "PAUSED".equals(nextStatus)
                    || "CLOSED".equals(nextStatus);
            case "PAUSED" -> "ACTIVE".equals(nextStatus)
                    || "CLOSED".equals(nextStatus);
            default -> false;
        };

        if (!allowed) {
            throw new IllegalStateException(
                    "Invalid subscription transition: " + status + " -> " + nextStatus
            );
        }

        this.status = nextStatus;
    }

}