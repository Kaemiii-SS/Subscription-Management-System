package com.brightloop.subscription_management_system.dashboard.repository;

import com.brightloop.subscription_management_system.dashboard.dto.OverdueInvoiceItemResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

@Repository
public class DashboardRepository {

    @PersistenceContext
    private EntityManager em;

    public long countActiveSubscriptions(Long customerId, Long planId) {
        String sql = """
                SELECT count(s.id) FROM subscriptions s
                WHERE s.status = 'ACTIVE'
                  AND (cast(:customerId AS bigint) IS NULL OR s.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);
        return ((Number) q.getSingleResult()).longValue();
    }

    public BigDecimal sumRevenueCollected(LocalDate from, LocalDate to, Long customerId, Long planId) {
        String sql = """
                SELECT COALESCE(sum(p.amount), 0) FROM payments p
                JOIN invoices i ON i.id = p.invoice_id
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE (cast(:from AS date) IS NULL OR p.payment_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR p.payment_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);
        return (BigDecimal) q.getSingleResult();
    }

    public BigDecimal sumAmountOwed(LocalDate from, LocalDate to, Long customerId, Long planId) {
        String sql = """
                SELECT COALESCE(sum(i.total - i.paid_amount), 0) FROM invoices i
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE i.status = 'CONFIRMED'
                  AND (cast(:from AS date) IS NULL OR i.invoice_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR i.invoice_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);
        return (BigDecimal) q.getSingleResult();
    }

    public Object[] getOverdueCountAndAmount(LocalDate from, LocalDate to, Long customerId, Long planId) {
        String sql = """
                SELECT count(i.id), COALESCE(sum(i.total - i.paid_amount), 0) FROM invoices i
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE
                  AND (cast(:from AS date) IS NULL OR i.invoice_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR i.invoice_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);
        return (Object[]) q.getSingleResult();
    }

    @SuppressWarnings("unchecked")
    public Map<String, BigDecimal> getBilledByMonth(LocalDate from, LocalDate to, Long customerId, Long planId) {
        String sql = """
                SELECT to_char(date_trunc('month', i.invoice_date), 'YYYY-MM') AS month,
                       COALESCE(sum(i.total), 0) AS billed
                FROM invoices i
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE i.status IN ('CONFIRMED', 'PAID')
                  AND (cast(:from AS date) IS NULL OR i.invoice_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR i.invoice_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                GROUP BY 1 ORDER BY 1
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);

        List<Object[]> rows = q.getResultList();
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String month = (String) row[0];
            BigDecimal billed = (BigDecimal) row[1];
            result.put(month, billed);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, BigDecimal> getCollectedByMonth(LocalDate from, LocalDate to, Long customerId, Long planId) {
        String sql = """
                SELECT to_char(date_trunc('month', p.payment_date), 'YYYY-MM') AS month,
                       COALESCE(sum(p.amount), 0) AS collected
                FROM payments p
                JOIN invoices i ON i.id = p.invoice_id
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE (cast(:from AS date) IS NULL OR p.payment_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR p.payment_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                GROUP BY 1 ORDER BY 1
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);

        List<Object[]> rows = q.getResultList();
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String month = (String) row[0];
            BigDecimal collected = (BigDecimal) row[1];
            result.put(month, collected);
        }
        return result;
    }

    public long countOverdueInvoices(LocalDate from, LocalDate to, Long customerId, Long planId) {
        String sql = """
                SELECT count(i.id)
                FROM invoices i
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE
                  AND (cast(:from AS date) IS NULL OR i.invoice_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR i.invoice_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId);
        return ((Number) q.getSingleResult()).longValue();
    }

    @SuppressWarnings("unchecked")
    public List<OverdueInvoiceItemResponse> getOverdueInvoices(LocalDate from, LocalDate to, Long customerId, Long planId, int offset, int limit) {
        String sql = """
                SELECT i.id AS invoice_id,
                       i.number,
                       u.name AS customer_name,
                       i.due_date,
                       (CURRENT_DATE - i.due_date) AS days_late,
                       i.total,
                       (i.total - i.paid_amount) AS amount_left
                FROM invoices i
                JOIN users u ON u.id = i.customer_id
                JOIN subscriptions s ON s.id = i.subscription_id
                WHERE i.status = 'CONFIRMED' AND i.due_date < CURRENT_DATE
                  AND (cast(:from AS date) IS NULL OR i.invoice_date >= cast(:from AS date))
                  AND (cast(:to AS date) IS NULL OR i.invoice_date <= cast(:to AS date))
                  AND (cast(:customerId AS bigint) IS NULL OR i.customer_id = cast(:customerId AS bigint))
                  AND (cast(:planId AS bigint) IS NULL OR s.plan_id = cast(:planId AS bigint))
                ORDER BY i.due_date ASC
                LIMIT :limit OFFSET :offset
                """;
        Query q = em.createNativeQuery(sql)
                .setParameter("from", from != null ? Date.valueOf(from) : null)
                .setParameter("to", to != null ? Date.valueOf(to) : null)
                .setParameter("customerId", customerId)
                .setParameter("planId", planId)
                .setParameter("limit", limit)
                .setParameter("offset", offset);

        List<Object[]> rows = q.getResultList();
        List<OverdueInvoiceItemResponse> items = new ArrayList<>();
        for (Object[] r : rows) {
            Long invoiceId = ((Number) r[0]).longValue();
            String number = (String) r[1];
            String customerName = (String) r[2];
            LocalDate dueDate = ((Date) r[3]).toLocalDate();
            long daysLate = ((Number) r[4]).longValue();
            BigDecimal total = (BigDecimal) r[5];
            BigDecimal amountLeft = (BigDecimal) r[6];

            items.add(new OverdueInvoiceItemResponse(
                    invoiceId,
                    number,
                    customerName,
                    dueDate,
                    daysLate,
                    formatMoney(total),
                    formatMoney(amountLeft)
            ));
        }
        return items;
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
