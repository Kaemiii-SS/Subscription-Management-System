
-- ==========================================
-- V2: CATALOG
-- Tables: taxes, products, product_variants, plans
-- ==========================================

-- 1. TAXES
CREATE TABLE taxes (
                       id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                       name    VARCHAR(80) NOT NULL UNIQUE,
                       percent NUMERIC(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
                       active  BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. PRODUCTS
CREATE TABLE products (
                          id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          name        VARCHAR(160) NOT NULL,
                          type        VARCHAR(40) NOT NULL,
                          sales_price NUMERIC(14,2) NOT NULL CHECK (sales_price >= 0),
                          cost_price  NUMERIC(14,2) NOT NULL CHECK (cost_price >= 0),
                          tax_id      BIGINT REFERENCES taxes(id),
                          notes       TEXT,
                          active      BOOLEAN NOT NULL DEFAULT TRUE,
                          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_active_name
    ON products (active, lower(name) text_pattern_ops);

CREATE INDEX idx_products_type
    ON products (type);

-- 3. PRODUCT VARIANTS
CREATE TABLE product_variants (
                                  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                  attribute   VARCHAR(60) NOT NULL,
                                  value       VARCHAR(60) NOT NULL,
                                  extra_price NUMERIC(14,2) NOT NULL DEFAULT 0,
                                  active      BOOLEAN NOT NULL DEFAULT TRUE,
                                  UNIQUE (product_id, attribute, value)
);

-- 4. PLANS
CREATE TABLE plans (
                       id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                       name           VARCHAR(120) NOT NULL,
                       price          NUMERIC(14,2) NOT NULL CHECK (price >= 0),
                       billing_period VARCHAR(10) NOT NULL
                           CHECK (billing_period IN ('DAILY','WEEKLY','MONTHLY','YEARLY')),
                       min_quantity   INT NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
                       available_from DATE NOT NULL,
                       available_to   DATE,
                       auto_close     BOOLEAN NOT NULL DEFAULT FALSE,
                       closable       BOOLEAN NOT NULL DEFAULT TRUE,
                       pausable       BOOLEAN NOT NULL DEFAULT FALSE,
                       renewable      BOOLEAN NOT NULL DEFAULT FALSE,
                       active         BOOLEAN NOT NULL DEFAULT TRUE,
                       created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
                       updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
                       CHECK (available_to IS NULL OR available_to >= available_from)
);

CREATE INDEX idx_plans_active_period
    ON plans (active, billing_period);
