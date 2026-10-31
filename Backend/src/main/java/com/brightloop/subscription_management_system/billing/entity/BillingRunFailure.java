package com.brightloop.subscription_management_system.billing.entity;

import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "billing_run_failures")
@Getter
@Setter
@NoArgsConstructor
public class BillingRunFailure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private BillingRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(nullable = false, length = 500)
    private String reason;

    public BillingRunFailure(BillingRun run, Subscription subscription, String reason) {
        this.run = run;
        this.subscription = subscription;
        this.reason = reason;
    }
}
