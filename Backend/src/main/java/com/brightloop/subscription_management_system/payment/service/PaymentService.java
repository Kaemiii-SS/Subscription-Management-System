package com.brightloop.subscription_management_system.payment.service;

import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import com.brightloop.subscription_management_system.billing.entity.Invoice;
import com.brightloop.subscription_management_system.billing.repository.InvoiceRepository;
import com.brightloop.subscription_management_system.common.dto.PageResponse;
import com.brightloop.subscription_management_system.payment.dto.PaymentRequest;
import com.brightloop.subscription_management_system.payment.dto.PaymentResponse;
import com.brightloop.subscription_management_system.payment.entity.Payment;
import com.brightloop.subscription_management_system.payment.repository.PaymentRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private static final int MAX_PAGE_SIZE = 100;

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public PaymentResponse recordPayment(Long invoiceId, PaymentRequest request) {
        Invoice invoice = invoiceRepository.findByIdWithLock(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));

        if (!"CONFIRMED".equals(invoice.getStatus())) {
            throw new IllegalStateException("Payment can only be recorded on CONFIRMED invoices. Current status: " + invoice.getStatus());
        }

        BigDecimal amountLeft = invoice.getTotal().subtract(invoice.getPaidAmount());
        BigDecimal paymentAmount = request.amount().setScale(2, RoundingMode.HALF_UP);

        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        if (paymentAmount.compareTo(amountLeft) > 0) {
            throw new IllegalStateException(
                    "Payment amount (" + paymentAmount + ") exceeds remaining invoice balance (" + amountLeft + ")"
            );
        }

        User currentUser = currentUserService.getCurrentUserEntityOptional().orElse(null);

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setMethod(request.normalizedMethod());
        payment.setAmount(paymentAmount);
        payment.setPaymentDate(request.effectivePaymentDate());
        payment.setNote(request.note());
        payment.setRecordedBy(currentUser);

        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal newPaidAmount = invoice.getPaidAmount().add(paymentAmount);
        invoice.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(invoice.getTotal()) >= 0) {
            invoice.setStatus("PAID");
            log.info("Invoice {} is now fully PAID", invoice.getNumber());
        }

        invoiceRepository.save(invoice);
        log.info("Recorded payment of {} ({}) on invoice {}", paymentAmount, payment.getMethod(), invoice.getNumber());

        return toResponse(savedPayment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));

        User currentUser = currentUserService.getCurrentUserEntity();
        if ("CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
            if (!payment.getInvoice().getCustomer().getId().equals(currentUser.getId())) {
                throw new EntityNotFoundException("Payment not found: " + id);
            }
        }

        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsForInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceId));

        User currentUser = currentUserService.getCurrentUserEntity();
        if ("CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
            if (!invoice.getCustomer().getId().equals(currentUser.getId())) {
                throw new EntityNotFoundException("Invoice not found: " + invoiceId);
            }
        }

        return paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(invoiceId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> listPayments(
            String method,
            Long invoiceId,
            LocalDate from,
            LocalDate to,
            Pageable pageable
    ) {
        User currentUser = currentUserService.getCurrentUserEntity();
        boolean isCustomer = "CUSTOMER".equalsIgnoreCase(currentUser.getRole());
        Long customerId = isCustomer ? currentUser.getId() : null;

        Specification<Payment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (customerId != null) {
                predicates.add(cb.equal(root.get("invoice").get("customer").get("id"), customerId));
            }
            if (invoiceId != null) {
                predicates.add(cb.equal(root.get("invoice").get("id"), invoiceId));
            }
            if (method != null && !method.isBlank()) {
                predicates.add(cb.equal(root.get("method"), method.toUpperCase()));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("paymentDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("paymentDate"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "paymentDate", "id");
        Pageable safe = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), MAX_PAGE_SIZE), sort);

        Page<Payment> page = paymentRepository.findAll(spec, safe);
        return PageResponse.of(page, this::toResponse);
    }

    public PaymentResponse toResponse(Payment payment) {
        Invoice inv = payment.getInvoice();
        PaymentResponse.InvoiceSummary summary = new PaymentResponse.InvoiceSummary(
                inv.getStatus(),
                formatMoney(inv.getPaidAmount()),
                formatMoney(inv.getAmountLeft())
        );

        String recordedByName = payment.getRecordedBy() != null ? payment.getRecordedBy().getName() : null;
        String invNumber = inv.getNumber();
        String customerName = inv.getCustomer() != null ? inv.getCustomer().getName() : null;
        Long customerId = inv.getCustomer() != null ? inv.getCustomer().getId() : null;
        String paymentNumber = String.format("PAY-2026-%03d", payment.getId());
        String reference = "REF-" + (100000 + (payment.getId() != null ? payment.getId() : 1));

        return new PaymentResponse(
                payment.getId(),
                inv.getId(),
                payment.getMethod(),
                formatMoney(payment.getAmount()),
                payment.getPaymentDate(),
                payment.getNote(),
                recordedByName,
                summary,
                invNumber,
                customerName,
                customerId,
                paymentNumber,
                payment.getPaymentDate(),
                reference
        );
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
