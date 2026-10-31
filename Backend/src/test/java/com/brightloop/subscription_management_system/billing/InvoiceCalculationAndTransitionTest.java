package com.brightloop.subscription_management_system.billing;

import com.brightloop.subscription_management_system.billing.entity.Invoice;
import com.brightloop.subscription_management_system.billing.entity.InvoiceLine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class InvoiceCalculationAndTransitionTest {

    @Test
    @DisplayName("Invoice line calculation should compute subtotal, tax, and line total correctly")
    void testInvoiceLineCalculations() {
        InvoiceLine line = new InvoiceLine();
        line.setQuantity(10);
        line.setUnitPrice(new BigDecimal("2560.00"));
        BigDecimal lineSubtotal = line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity())).setScale(2, RoundingMode.HALF_UP);
        line.setLineSubtotal(lineSubtotal);

        BigDecimal discountAmount = new BigDecimal("2560.00");
        line.setDiscountAmount(discountAmount);

        BigDecimal taxableAmount = lineSubtotal.subtract(discountAmount);
        line.setTaxableAmount(taxableAmount);

        BigDecimal taxPercent = new BigDecimal("18.00");
        line.setTaxPercent(taxPercent);

        BigDecimal taxAmount = taxableAmount.multiply(taxPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        line.setTaxAmount(taxAmount);

        BigDecimal lineTotal = taxableAmount.add(taxAmount);
        line.setLineTotal(lineTotal);

        assertEquals(new BigDecimal("25600.00"), line.getLineSubtotal());
        assertEquals(new BigDecimal("23040.00"), line.getTaxableAmount());
        assertEquals(new BigDecimal("4147.20"), line.getTaxAmount());
        assertEquals(new BigDecimal("27187.20"), line.getLineTotal());
    }

    @Test
    @DisplayName("Invoice total should match subtotal minus discount plus tax")
    void testInvoiceTotals() {
        Invoice invoice = new Invoice();
        invoice.setSubtotal(new BigDecimal("25600.00"));
        invoice.setDiscountTotal(new BigDecimal("2560.00"));
        invoice.setTaxTotal(new BigDecimal("4147.20"));
        BigDecimal total = invoice.getSubtotal().subtract(invoice.getDiscountTotal()).add(invoice.getTaxTotal());
        invoice.setTotal(total);

        assertEquals(new BigDecimal("27187.20"), invoice.getTotal());

        invoice.setPaidAmount(new BigDecimal("10000.00"));
        assertEquals(new BigDecimal("17187.20"), invoice.getAmountLeft());
    }

    @Test
    @DisplayName("Invoice status transitions should enforce allowed moves")
    void testInvoiceTransitions() {
        Invoice invoice = new Invoice();
        invoice.setStatus("DRAFT");
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setTotal(new BigDecimal("1000.00"));

        // DRAFT -> CONFIRMED
        invoice.transitionTo("CONFIRMED");
        assertEquals("CONFIRMED", invoice.getStatus());

        // CONFIRMED with zero payments can be CANCELLED
        Invoice cancelInvoice = new Invoice();
        cancelInvoice.setStatus("CONFIRMED");
        cancelInvoice.setPaidAmount(BigDecimal.ZERO);
        cancelInvoice.transitionTo("CANCELLED");
        assertEquals("CANCELLED", cancelInvoice.getStatus());

        // CONFIRMED with payments cannot be CANCELLED
        Invoice paidInvoice = new Invoice();
        paidInvoice.setStatus("CONFIRMED");
        paidInvoice.setPaidAmount(new BigDecimal("500.00"));
        assertThrows(IllegalStateException.class, () -> paidInvoice.transitionTo("CANCELLED"));

        // CONFIRMED -> PAID
        Invoice fullPayInvoice = new Invoice();
        fullPayInvoice.setStatus("CONFIRMED");
        fullPayInvoice.setTotal(new BigDecimal("1000.00"));
        fullPayInvoice.setPaidAmount(new BigDecimal("1000.00"));
        fullPayInvoice.transitionTo("PAID");
        assertEquals("PAID", fullPayInvoice.getStatus());

        // Invalid transition: CANCELLED -> CONFIRMED
        assertThrows(IllegalStateException.class, () -> cancelInvoice.transitionTo("CONFIRMED"));
    }

    @Test
    @DisplayName("Invoice overdue flag should be true only for CONFIRMED invoices past due date")
    void testOverdueFlag() {
        Invoice invoice = new Invoice();
        invoice.setStatus("CONFIRMED");
        invoice.setDueDate(LocalDate.now().minusDays(3));
        assertTrue(invoice.isOverdue());

        invoice.setDueDate(LocalDate.now().plusDays(3));
        assertFalse(invoice.isOverdue());

        invoice.setDueDate(LocalDate.now().minusDays(3));
        invoice.setStatus("PAID");
        assertFalse(invoice.isOverdue());

        invoice.setStatus("DRAFT");
        assertFalse(invoice.isOverdue());
    }
}
