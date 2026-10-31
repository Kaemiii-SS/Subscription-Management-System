package com.brightloop.subscription_management_system.billing.entity;

import com.brightloop.subscription_management_system.discount.entity.Discount;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String number;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false, length = 10)
    private String status = "DRAFT";

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "payment_terms_days", nullable = false)
    private Integer paymentTermsDays = 0;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "tax_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_id")
    private Discount discount;

    @Column(name = "sent_at")
    private OffsetDateTime sentAt;

    @Version
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceLine> lines = new ArrayList<>();

    @OneToMany(mappedBy = "invoice")
    @OrderBy("paymentDate DESC, createdAt DESC")
    private List<com.brightloop.subscription_management_system.payment.entity.Payment> payments = new ArrayList<>();

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

    public void addLine(InvoiceLine line) {
        lines.add(line);
        line.setInvoice(this);
    }

    public boolean isOverdue() {
        return "CONFIRMED".equals(status) && dueDate != null && dueDate.isBefore(LocalDate.now());
    }

    public BigDecimal getAmountLeft() {
        if (total == null) return BigDecimal.ZERO;
        if (paidAmount == null) return total;
        return total.subtract(paidAmount);
    }

    public void transitionTo(String nextStatus) {
        boolean allowed = switch (this.status) {
            case "DRAFT" -> "CONFIRMED".equals(nextStatus) || "CANCELLED".equals(nextStatus);
            case "CONFIRMED" -> "PAID".equals(nextStatus) || ("CANCELLED".equals(nextStatus) && paidAmount.compareTo(BigDecimal.ZERO) == 0);
            default -> false;
        };

        if (!allowed) {
            throw new IllegalStateException("Invalid invoice transition from " + status + " to " + nextStatus);
        }

        this.status = nextStatus;
    }
}
