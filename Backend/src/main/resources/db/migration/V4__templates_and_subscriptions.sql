
-- ==========================================
-- V4: QUOTATION TEMPLATES AND SUBSCRIPTIONS
-- ==========================================

-- Subscription number generator
CREATE SEQUENCE subscription_number_seq START 1;

-- 1. QUOTATION TEMPLATES
CREATE TABLE quotation_templates (
                                     id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                     name          VARCHAR(160) NOT NULL,
                                     validity_days INT NOT NULL CHECK (validity_days > 0),
                                     plan_id       BIGINT NOT NULL REFERENCES plans(id),
                                     active        BOOLEAN NOT NULL DEFAULT TRUE,
                                     created_by    BIGINT REFERENCES users(id),
                                     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                                     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. QUOTATION TEMPLATE LINES
CREATE TABLE quotation_template_lines (
                                          id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                          template_id BIGINT NOT NULL
                                              REFERENCES quotation_templates(id) ON DELETE CASCADE,
                                          product_id  BIGINT NOT NULL REFERENCES products(id),
                                          variant_id  BIGINT REFERENCES product_variants(id),
                                          quantity    INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_tpl_lines_template
    ON quotation_template_lines (template_id);

-- 3. SUBSCRIPTIONS
CREATE TABLE subscriptions (
                               id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                               number             VARCHAR(30) NOT NULL UNIQUE,
                               customer_id        BIGINT NOT NULL REFERENCES users(id),
                               plan_id            BIGINT NOT NULL REFERENCES plans(id),
                               template_id        BIGINT REFERENCES quotation_templates(id),
                               status             VARCHAR(10) NOT NULL DEFAULT 'DRAFT'
                                   CHECK (status IN (
                                                     'DRAFT',
                                                     'QUOTATION',
                                                     'CONFIRMED',
                                                     'ACTIVE',
                                                     'PAUSED',
                                                     'CLOSED'
                                       )),
                               start_date         DATE NOT NULL,
                               expiry_date        DATE NOT NULL,
                               payment_terms_days INT NOT NULL DEFAULT 0
                                   CHECK (payment_terms_days >= 0),
                               quote_valid_until  DATE,
                               next_billing_date  DATE,
                               subtotal           NUMERIC(14,2) NOT NULL DEFAULT 0,
                               tax_total          NUMERIC(14,2) NOT NULL DEFAULT 0,
                               total              NUMERIC(14,2) NOT NULL DEFAULT 0,
                               activated_at       TIMESTAMPTZ,
                               closed_at          TIMESTAMPTZ,
                               created_by         BIGINT REFERENCES users(id),
                               version            BIGINT NOT NULL DEFAULT 0,
                               created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
                               updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

                               CHECK (expiry_date >= start_date)
);

CREATE INDEX idx_subs_customer_status
    ON subscriptions (customer_id, status);

CREATE INDEX idx_subs_status
    ON subscriptions (status);

CREATE INDEX idx_subs_plan
    ON subscriptions (plan_id);

CREATE INDEX idx_subs_due_billing
    ON subscriptions (next_billing_date)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_subs_expiry_open
    ON subscriptions (expiry_date)
    WHERE status IN ('ACTIVE', 'PAUSED');

-- 4. SUBSCRIPTION LINES
CREATE TABLE subscription_lines (
                                    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                    subscription_id BIGINT NOT NULL
                                        REFERENCES subscriptions(id) ON DELETE CASCADE,
                                    product_id      BIGINT NOT NULL REFERENCES products(id),
                                    variant_id      BIGINT REFERENCES product_variants(id),
                                    description     VARCHAR(255) NOT NULL,
                                    quantity        INT NOT NULL CHECK (quantity > 0),
                                    unit_price      NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
                                    tax_percent     NUMERIC(5,2) NOT NULL DEFAULT 0
                                        CHECK (tax_percent BETWEEN 0 AND 100),
                                    line_subtotal   NUMERIC(14,2) NOT NULL,
                                    tax_amount      NUMERIC(14,2) NOT NULL,
                                    line_total      NUMERIC(14,2) NOT NULL,

                                    CHECK (line_total = line_subtotal + tax_amount)
);

CREATE INDEX idx_sub_lines_subscription
    ON subscription_lines (subscription_id);

-- 5. SUBSCRIPTION STATUS HISTORY
CREATE TABLE subscription_status_history (
                                             id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                             subscription_id BIGINT NOT NULL
                                                 REFERENCES subscriptions(id) ON DELETE CASCADE,
                                             from_status     VARCHAR(10),
                                             to_status       VARCHAR(10) NOT NULL,
                                             changed_by      BIGINT REFERENCES users(id),
                                             note            VARCHAR(255),
                                             created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_history
    ON subscription_status_history (subscription_id, created_at DESC);
