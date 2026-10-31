
-- ==========================================
-- V6: BILLING RUNS AND FAILURES
-- ==========================================

-- 1. BILLING RUNS
CREATE TABLE billing_runs (
                              id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                              finished_at   TIMESTAMPTZ,
                              triggered_by  BIGINT REFERENCES users(id),
                              created_count INT NOT NULL DEFAULT 0,
                              skipped_count INT NOT NULL DEFAULT 0,
                              failed_count  INT NOT NULL DEFAULT 0
);

-- 2. BILLING RUN FAILURES
CREATE TABLE billing_run_failures (
                                      id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                      run_id          BIGINT NOT NULL
                                          REFERENCES billing_runs(id) ON DELETE CASCADE,
                                      subscription_id BIGINT NOT NULL REFERENCES subscriptions(id),
                                      reason          VARCHAR(500) NOT NULL
);

CREATE INDEX idx_billing_failures_run
    ON billing_run_failures (run_id);
