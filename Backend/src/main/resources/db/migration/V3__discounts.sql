
-- ==========================================
-- V3: DISCOUNTS
-- ==========================================

CREATE TABLE discounts (
                           id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                           name         VARCHAR(120) NOT NULL,
                           type         VARCHAR(10) NOT NULL
                               CHECK (type IN ('FIXED', 'PERCENT')),
                           value        NUMERIC(14,2) NOT NULL CHECK (value > 0),
                           min_purchase NUMERIC(14,2),
                           min_quantity INT,
                           start_date   DATE NOT NULL,
                           end_date     DATE NOT NULL,
                           usage_limit  INT,
                           used_count   INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
                           applies_to   VARCHAR(12) NOT NULL
                               CHECK (applies_to IN ('PRODUCT', 'SUBSCRIPTION')),
                           product_id   BIGINT REFERENCES products(id),
                           active       BOOLEAN NOT NULL DEFAULT TRUE,
                           created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
                           updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

                           CHECK (end_date >= start_date),
                           CHECK (type = 'FIXED' OR value <= 100),
                           CHECK (applies_to <> 'PRODUCT' OR product_id IS NOT NULL),
                           CHECK (applies_to <> 'SUBSCRIPTION' OR product_id IS NULL),
                           CHECK (usage_limit IS NULL OR used_count <= usage_limit)
);

CREATE INDEX idx_discounts_valid
    ON discounts (active, start_date, end_date);

CREATE INDEX idx_discounts_product
    ON discounts (product_id)
    WHERE product_id IS NOT NULL;
