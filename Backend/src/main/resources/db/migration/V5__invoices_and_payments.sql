
-- ==========================================
-- V5: INVOICES, PAYMENTS AND DISCOUNT USAGE
-- ==========================================

-- Invoice number generator
CREATE SEQUENCE invoice_number_seq START 1;

-- 1. INVOICES
CREATE TABLE invoices (
                          id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          number             VARCHAR(30) NOT NULL UNIQUE,
                          subscription_id    BIGINT NOT NULL REFERENCES subscriptions(id),
                          customer_id        BIGINT NOT NULL REFERENCES users(id),
                          status             VARCHAR(10) NOT NULL DEFAULT 'DRAFT'
                              CHECK (status IN (
                                                'DRAFT',
                                                'CONFIRMED',
                                                'PAID',
                                                'CANCELLED'
                                  )),
                          period_start       DATE NOT NULL,
                          period_end         DATE NOT NULL,
                          invoice_date       DATE NOT NULL,
                          payment_terms_days INT NOT NULL,
                          due_date           DATE NOT NULL,
                          subtotal           NUMERIC(14,2) NOT NULL,
                          discount_total     NUMERIC(14,2) NOT NULL DEFAULT 0,
                          tax_total          NUMERIC(14,2) NOT NULL,
                          total              NUMERIC(14,2) NOT NULL,
                          paid_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
                          discount_id        BIGINT REFERENCES discounts(id),
                          sent_at            TIMESTAMPTZ,
                          version            BIGINT NOT NULL DEFAULT 0,
                          created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
                          updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

                          CHECK (period_end >= period_start),
                          CHECK (due_date >= invoice_date),
                          CHECK (total = subtotal - discount_total + tax_total),
                          CHECK (paid_amount >= 0 AND paid_amount <= total),
                          CHECK (status <> 'PAID' OR paid_amount = total)
);

-- Prevent duplicate live invoices for the same subscription period
CREATE UNIQUE INDEX uq_invoice_period
    ON invoices (subscription_id, period_start)
    WHERE status <> 'CANCELLED';

CREATE INDEX idx_inv_customer_date
    ON invoices (customer_id, invoice_date DESC);

CREATE INDEX idx_inv_status_due
    ON invoices (status, due_date);

CREATE INDEX idx_inv_subscription
    ON invoices (subscription_id);

CREATE INDEX idx_inv_date
    ON invoices (invoice_date);

CREATE INDEX idx_inv_overdue
    ON invoices (due_date)
    WHERE status = 'CONFIRMED';

-- 2. INVOICE LINES
CREATE TABLE invoice_lines (
                               id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                               invoice_id           BIGINT NOT NULL
                                   REFERENCES invoices(id) ON DELETE CASCADE,
                               subscription_line_id BIGINT REFERENCES subscription_lines(id),
                               product_id           BIGINT NOT NULL REFERENCES products(id),
                               variant_id           BIGINT REFERENCES product_variants(id),
                               description          VARCHAR(255) NOT NULL,
                               quantity             INT NOT NULL CHECK (quantity > 0),
                               unit_price           NUMERIC(14,2) NOT NULL,
                               line_subtotal        NUMERIC(14,2) NOT NULL,
                               discount_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
                               taxable_amount       NUMERIC(14,2) NOT NULL,
                               tax_percent          NUMERIC(5,2) NOT NULL,
                               tax_amount           NUMERIC(14,2) NOT NULL,
                               line_total           NUMERIC(14,2) NOT NULL,

                               CHECK (taxable_amount = line_subtotal - discount_amount),
                               CHECK (line_total = taxable_amount + tax_amount)
);

CREATE INDEX idx_inv_lines_invoice
    ON invoice_lines (invoice_id);

-- 3. DISCOUNT USAGES
CREATE TABLE discount_usages (
                                 id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                 discount_id BIGINT NOT NULL REFERENCES discounts(id),
                                 invoice_id  BIGINT NOT NULL UNIQUE REFERENCES invoices(id),
                                 amount      NUMERIC(14,2) NOT NULL,
                                 created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discount_usages_discount
    ON discount_usages (discount_id);

-- 4. PAYMENTS
CREATE TABLE payments (
                          id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          invoice_id   BIGINT NOT NULL REFERENCES invoices(id),
                          method       VARCHAR(15) NOT NULL
                              CHECK (method IN (
                                                'CASH',
                                                'CARD',
                                                'UPI',
                                                'BANK_TRANSFER',
                                                'CHEQUE',
                                                'OTHER'
                                  )),
                          amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
                          payment_date DATE NOT NULL,
                          note         VARCHAR(500),
                          recorded_by  BIGINT REFERENCES users(id),
                          created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice
    ON payments (invoice_id);

CREATE INDEX idx_payments_date
    ON payments (payment_date);
