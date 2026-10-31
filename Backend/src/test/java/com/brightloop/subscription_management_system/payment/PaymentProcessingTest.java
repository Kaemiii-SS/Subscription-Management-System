package com.brightloop.subscription_management_system.payment;

import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import com.brightloop.subscription_management_system.billing.entity.Invoice;
import com.brightloop.subscription_management_system.billing.repository.InvoiceRepository;
import com.brightloop.subscription_management_system.payment.dto.PaymentRequest;
import com.brightloop.subscription_management_system.payment.dto.PaymentResponse;
import com.brightloop.subscription_management_system.payment.entity.Payment;
import com.brightloop.subscription_management_system.payment.repository.PaymentRepository;
import com.brightloop.subscription_management_system.payment.service.PaymentService;
import com.brightloop.subscription_management_system.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentProcessingTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private PaymentService paymentService;

    private Invoice confirmedInvoice;
    private User staffUser;

    @BeforeEach
    void setUp() {
        staffUser = new User();
        staffUser.setId(1L);
        staffUser.setName("Staff Member");
        staffUser.setRole("STAFF");

        confirmedInvoice = new Invoice();
        confirmedInvoice.setId(100L);
        confirmedInvoice.setNumber("INV-2026-00100");
        confirmedInvoice.setStatus("CONFIRMED");
        confirmedInvoice.setTotal(new BigDecimal("1000.00"));
        confirmedInvoice.setPaidAmount(new BigDecimal("200.00"));
    }

    @Test
    @DisplayName("Should successfully record a partial payment and update paid amount")
    void testPartialPaymentSuccess() {
        when(invoiceRepository.findByIdWithLock(100L)).thenReturn(Optional.of(confirmedInvoice));
        when(currentUserService.getCurrentUserEntityOptional()).thenReturn(Optional.of(staffUser));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(55L);
            return p;
        });

        PaymentRequest request = new PaymentRequest("UPI", new BigDecimal("300.00"), LocalDate.now(), "Partial pay");
        PaymentResponse response = paymentService.recordPayment(100L, request);

        assertNotNull(response);
        assertEquals("300.00", response.amount());
        assertEquals("CONFIRMED", confirmedInvoice.getStatus());
        assertEquals(new BigDecimal("500.00"), confirmedInvoice.getPaidAmount());
        assertEquals("500.00", response.invoice().amountLeft());
        verify(invoiceRepository).save(confirmedInvoice);
    }

    @Test
    @DisplayName("Should transition invoice to PAID when remaining balance is fully settled")
    void testFullPaymentTransitionsToPaid() {
        when(invoiceRepository.findByIdWithLock(100L)).thenReturn(Optional.of(confirmedInvoice));
        when(currentUserService.getCurrentUserEntityOptional()).thenReturn(Optional.of(staffUser));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(56L);
            return p;
        });

        // 800.00 settles the entire 1000.00 - 200.00
        PaymentRequest request = new PaymentRequest("BANK_TRANSFER", new BigDecimal("800.00"), LocalDate.now(), "Final pay");
        PaymentResponse response = paymentService.recordPayment(100L, request);

        assertEquals("PAID", confirmedInvoice.getStatus());
        assertEquals(new BigDecimal("1000.00"), confirmedInvoice.getPaidAmount());
        assertEquals("0.00", response.invoice().amountLeft());
        verify(invoiceRepository).save(confirmedInvoice);
    }

    @Test
    @DisplayName("Should reject payment exceeding remaining balance")
    void testOverpaymentRejected() {
        when(invoiceRepository.findByIdWithLock(100L)).thenReturn(Optional.of(confirmedInvoice));

        // Amount left is 800.00, attempting to pay 801.00
        PaymentRequest request = new PaymentRequest("CARD", new BigDecimal("801.00"), LocalDate.now(), "Overpay");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                paymentService.recordPayment(100L, request)
        );
        assertTrue(ex.getMessage().contains("exceeds remaining invoice balance"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject payment on draft or cancelled invoice")
    void testPaymentOnNonConfirmedInvoiceRejected() {
        confirmedInvoice.setStatus("DRAFT");
        when(invoiceRepository.findByIdWithLock(100L)).thenReturn(Optional.of(confirmedInvoice));

        PaymentRequest request = new PaymentRequest("CASH", new BigDecimal("100.00"), LocalDate.now(), "Draft pay");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                paymentService.recordPayment(100L, request)
        );
        assertTrue(ex.getMessage().contains("CONFIRMED invoices"));
    }
}
