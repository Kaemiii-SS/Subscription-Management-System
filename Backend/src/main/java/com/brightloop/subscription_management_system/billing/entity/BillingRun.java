package com.brightloop.subscription_management_system.billing.entity;

import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "billing_runs")
@Getter
@Setter
@NoArgsConstructor
public class BillingRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "started_at", nullable = false, updatable = false)
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by")
    private User triggeredBy;

    @Column(name = "created_count", nullable = false)
    private int createdCount = 0;

    @Column(name = "skipped_count", nullable = false)
    private int skippedCount = 0;

    @Column(name = "failed_count", nullable = false)
    private int failedCount = 0;

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillingRunFailure> failures = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = OffsetDateTime.now();
        }
    }

    public void addFailure(BillingRunFailure failure) {
        failures.add(failure);
        failure.setRun(this);
    }
}
