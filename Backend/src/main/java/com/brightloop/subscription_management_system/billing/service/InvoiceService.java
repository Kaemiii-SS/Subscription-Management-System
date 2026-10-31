package com.brightloop.subscription_management_system.billing.service;

import com.brightloop.subscription_management_system.auth.service.CurrentUserService;
import com.brightloop.subscription_management_system.billing.dto.InvoiceResponse;
import com.brightloop.subscription_management_system.billing.entity.DiscountUsage;
import com.brightloop.subscription_management_system.billing.entity.Invoice;
import com.brightloop.subscription_management_system.billing.entity.InvoiceLine;
import com.brightloop.subscription_management_system.billing.repository.DiscountUsageRepository;
import com.brightloop.subscription_management_system.billing.repository.InvoiceRepository;
import com.brightloop.subscription_management_system.common.dto.PageResponse;
import com.brightloop.subscription_management_system.discount.dto.DiscountContext;
import com.brightloop.subscription_management_system.discount.dto.DiscountResult;
import com.brightloop.subscription_management_system.discount.entity.Discount;
import com.brightloop.subscription_management_system.discount.repository.DiscountRepository;
import com.brightloop.subscription_management_system.discount.service.DiscountSelectionService;
import com.brightloop.subscription_management_system.discount.service.DiscountService;
import com.brightloop.subscription_management_system.payment.entity.Payment;
import com.brightloop.subscription_management_system.payment.repository.PaymentRepository;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import com.brightloop.subscription_management_system.subscription.entity.SubscriptionLine;
import com.brightloop.subscription_management_system.subscription.repository.SubscriptionRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private static final int MAX_PAGE_SIZE = 100;

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceNumberService invoiceNumberService;
    private final InvoicePdfService invoicePdfService;
    private final DiscountSelectionService discountSelectionService;
    private final DiscountService discountService;
    private final DiscountRepository discountRepository;
    private final DiscountUsageRepository discountUsageRepository;
    private final PaymentRepository paymentRepository;
    private final CurrentUserService currentUserService;
    private final Optional<JavaMailSender> mailSender;

    @Value("${app.billing.auto-confirm:true}")
    private boolean autoConfirm;

    @Transactional
    public Invoice generateFor(Subscription subscription, LocalDate periodStart, LocalDate periodEnd, LocalDate invoiceDate) {
        if (invoiceRepository.existsBySubscriptionIdAndPeriodStartAndStatusNot(subscription.getId(), periodStart, "CANCELLED")) {
            throw new IllegalStateException("Invoice already exists for subscription " + subscription.getNumber() + " and period " + periodStart);
        }

        List<SubscriptionLine> subLines = subscription.getLines();
        if (subLines.isEmpty()) {
            throw new IllegalStateException("Subscription has no lines: " + subscription.getNumber());
        }

        // Build context for discount evaluation
        List<DiscountContext.Line> discountLines = new ArrayList<>();
        List<BigDecimal> rawLineSubtotals = new ArrayList<>();

        for (SubscriptionLine sl : subLines) {
            BigDecimal subtotal = sl.getUnitPrice()
                    .multiply(BigDecimal.valueOf(sl.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            rawLineSubtotals.add(subtotal);
            discountLines.add(new DiscountContext.Line(sl.getProduct().getId(), sl.getQuantity(), subtotal));
        }

        DiscountContext discountContext = new DiscountContext(invoiceDate, discountLines);
        Optional<DiscountResult> bestDiscount = discountSelectionService.findBest(discountContext);

        Discount discountEntity = null;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO.setScale(2);
        List<BigDecimal> allocatedDiscounts = new ArrayList<>(Collections.nCopies(subLines.size(), BigDecimal.ZERO.setScale(2)));

        if (bestDiscount.isPresent()) {
            DiscountResult result = bestDiscount.get();
            try {
                discountService.useSlot(result.discountId());
                discountEntity = discountRepository.findById(result.discountId()).orElse(null);
                totalDiscountAmount = result.amount();
                allocatedDiscounts = result.lineAllocations();
            } catch (Exception e) {
                log.warn("Could not use discount {}: {}", result.discountId(), e.getMessage());
            }
        }

        Invoice invoice = new Invoice();
        invoice.setNumber(invoiceNumberService.generate());
        invoice.setSubscription(subscription);
        invoice.setCustomer(subscription.getCustomer());
        invoice.setStatus(autoConfirm ? "CONFIRMED" : "DRAFT");
        invoice.setPeriodStart(periodStart);
        invoice.setPeriodEnd(periodEnd);
        invoice.setInvoiceDate(invoiceDate);
        invoice.setPaymentTermsDays(subscription.getPaymentTermsDays());
        invoice.setDueDate(invoiceDate.plusDays(subscription.getPaymentTermsDays()));
        invoice.setDiscount(discountEntity);
        invoice.setPaidAmount(BigDecimal.ZERO.setScale(2));

        BigDecimal invoiceSubtotal = BigDecimal.ZERO.setScale(2);
        BigDecimal invoiceTaxTotal = BigDecimal.ZERO.setScale(2);
        BigDecimal invoiceDiscountTotal = totalDiscountAmount;

        for (int i = 0; i < subLines.size(); i++) {
            SubscriptionLine sl = subLines.get(i);
            BigDecimal lineSubtotal = rawLineSubtotals.get(i);
            BigDecimal lineDiscount = allocatedDiscounts.get(i);
            BigDecimal taxableAmount = lineSubtotal.subtract(lineDiscount);
            BigDecimal taxAmount = taxableAmount.multiply(sl.getTaxPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = taxableAmount.add(taxAmount);

            InvoiceLine il = new InvoiceLine();
            il.setInvoice(invoice);
            il.setSubscriptionLine(sl);
            il.setProduct(sl.getProduct());
            il.setVariant(sl.getVariant());
            il.setDescription(sl.getDescription());
            il.setQuantity(sl.getQuantity());
            il.setUnitPrice(sl.getUnitPrice());
            il.setLineSubtotal(lineSubtotal);
            il.setDiscountAmount(lineDiscount);
            il.setTaxableAmount(taxableAmount);
            il.setTaxPercent(sl.getTaxPercent());
            il.setTaxAmount(taxAmount);
            il.setLineTotal(lineTotal);

            invoice.addLine(il);

            invoiceSubtotal = invoiceSubtotal.add(lineSubtotal);
            invoiceTaxTotal = invoiceTaxTotal.add(taxAmount);
        }

        BigDecimal invoiceTotal = invoiceSubtotal.subtract(invoiceDiscountTotal).add(invoiceTaxTotal);

        invoice.setSubtotal(invoiceSubtotal);
        invoice.setDiscountTotal(invoiceDiscountTotal);
        invoice.setTaxTotal(invoiceTaxTotal);
        invoice.setTotal(invoiceTotal);

        Invoice saved = invoiceRepository.save(invoice);

        if (discountEntity != null && totalDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
            DiscountUsage usage = new DiscountUsage();
            usage.setDiscount(discountEntity);
            usage.setInvoice(saved);
            usage.setAmount(totalDiscountAmount);
            discountUsageRepository.save(usage);
        }

        // Advance subscription nextBillingDate
        subscription.setNextBillingDate(periodEnd.plusDays(1));
        subscriptionRepository.save(subscription);

        log.info("Generated invoice {} for subscription {}", saved.getNumber(), subscription.getNumber());
        return saved;
    }

    @Transactional
    public InvoiceResponse confirm(Long id) {
        Invoice invoice = findWithAccessCheck(id);
        invoice.transitionTo("CONFIRMED");
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse cancel(Long id) {
        Invoice invoice = findWithAccessCheck(id);
        if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Cannot cancel an invoice with recorded payments");
        }

        invoice.transitionTo("CANCELLED");

        // Revert discount slot if used
        discountUsageRepository.findByInvoiceId(id).ifPresent(usage -> {
            discountService.revertSlot(usage.getDiscount().getId());
            discountUsageRepository.deleteByInvoiceId(id);
        });

        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse send(Long id) {
        Invoice invoice = findWithAccessCheck(id);
        if (!"CONFIRMED".equals(invoice.getStatus())) {
            throw new IllegalStateException("Only confirmed invoices can be sent");
        }

        invoice.setSentAt(OffsetDateTime.now());

        // Send email asynchronously or best-effort
        mailSender.ifPresent(sender -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(invoice.getCustomer().getEmail());
                message.setSubject("Brightloop Invoice: " + invoice.getNumber());
                message.setText("Dear " + invoice.getCustomer().getName() + ",\n\n"
                        + "Your invoice " + invoice.getNumber() + " for total " + formatMoney(invoice.getTotal())
                        + " is ready. Due date: " + invoice.getDueDate() + ".\n\n"
                        + "Thank you for your business!");
                sender.send(message);
                log.info("Sent invoice email to {}", invoice.getCustomer().getEmail());
            } catch (Exception e) {
                log.warn("Failed to send email for invoice {}: {}", invoice.getNumber(), e.getMessage());
            }
        });

        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getById(Long id) {
        return toResponse(findWithAccessCheck(id));
    }

    @Transactional(readOnly = true)
    public byte[] getPdf(Long id) {
        Invoice invoice = findWithAccessCheck(id);
        return invoicePdfService.generatePdf(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesForSubscription(Long subscriptionId) {
        User currentUser = currentUserService.getCurrentUserEntity();
        boolean isCustomer = "CUSTOMER".equalsIgnoreCase(currentUser.getRole());

        List<Invoice> invoices = isCustomer
                ? invoiceRepository.findBySubscriptionIdAndCustomerIdOrderByInvoiceDateDesc(subscriptionId, currentUser.getId())
                : invoiceRepository.findBySubscriptionIdOrderByInvoiceDateDesc(subscriptionId);

        return invoices.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> listInvoices(
            String status,
            Boolean overdue,
            Boolean outstanding,
            Long customerId,
            Long subscriptionId,
            LocalDate from,
            LocalDate to,
            String search,
            Pageable pageable
    ) {
        User currentUser = currentUserService.getCurrentUserEntity();
        boolean isCustomer = "CUSTOMER".equalsIgnoreCase(currentUser.getRole());

        Long effectiveCustomerId = isCustomer ? currentUser.getId() : customerId;
        if (isCustomer && customerId != null && !customerId.equals(currentUser.getId())) {
            throw new EntityNotFoundException("Customer cannot access other customers' invoices");
        }

        LocalDate today = LocalDate.now();

        Specification<Invoice> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (effectiveCustomerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), effectiveCustomerId));
            }
            if (subscriptionId != null) {
                predicates.add(cb.equal(root.get("subscription").get("id"), subscriptionId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.toUpperCase()));
            }
            if (Boolean.TRUE.equals(overdue)) {
                predicates.add(cb.equal(root.get("status"), "CONFIRMED"));
                predicates.add(cb.lessThan(root.get("dueDate"), today));
            }
            if (Boolean.TRUE.equals(outstanding)) {
                predicates.add(cb.equal(root.get("status"), "CONFIRMED"));
                predicates.add(cb.lessThan(root.get("paidAmount"), root.get("total")));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("invoiceDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("invoiceDate"), to));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate searchNumber = cb.like(cb.lower(root.get("number")), pattern);
                Predicate searchCustName = cb.like(cb.lower(root.get("customer").get("name")), pattern);
                Predicate searchCustEmail = cb.like(cb.lower(root.get("customer").get("email")), pattern);
                predicates.add(cb.or(searchNumber, searchCustName, searchCustEmail));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "invoiceDate", "id");
        Pageable safe = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), MAX_PAGE_SIZE), sort);

        Page<Invoice> page = invoiceRepository.findAll(spec, safe);
        return PageResponse.of(page, this::toResponse);
    }

    public Invoice findWithAccessCheck(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + id));

        User currentUser = currentUserService.getCurrentUserEntity();
        if ("CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
            if (!invoice.getCustomer().getId().equals(currentUser.getId())) {
                throw new EntityNotFoundException("Invoice not found: " + id);
            }
        }

        return invoice;
    }

    public InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceResponse.InvoiceLineResponse> lines = invoice.getLines().stream()
                .map(l -> new InvoiceResponse.InvoiceLineResponse(
                        l.getId(),
                        l.getDescription(),
                        l.getQuantity(),
                        formatMoney(l.getUnitPrice()),
                        formatMoney(l.getTaxPercent()),
                        formatMoney(l.getLineTotal())
                ))
                .toList();

        InvoiceResponse.DiscountRef discountRef = null;
        if (invoice.getDiscount() != null) {
            discountRef = new InvoiceResponse.DiscountRef(
                    invoice.getDiscount().getId(),
                    invoice.getDiscount().getName(),
                    formatMoney(invoice.getDiscountTotal())
            );
        }

        List<String> allowedActions = switch (invoice.getStatus()) {
            case "DRAFT" -> List.of("confirm", "cancel");
            case "CONFIRMED" -> invoice.getPaidAmount().compareTo(BigDecimal.ZERO) == 0
                    ? List.of("cancel", "send")
                    : List.of("send");
            default -> List.of();
        };

        List<InvoiceResponse.PaymentSummaryResponse> payments = invoice.getPayments().stream()
                .map(p -> new InvoiceResponse.PaymentSummaryResponse(
                        p.getId(),
                        p.getMethod(),
                        formatMoney(p.getAmount()),
                        p.getPaymentDate(),
                        p.getNote()
                ))
                .toList();

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getNumber(),
                invoice.getStatus(),
                new InvoiceResponse.SubscriptionRef(invoice.getSubscription().getId(), invoice.getSubscription().getNumber()),
                new InvoiceResponse.CustomerRef(invoice.getCustomer().getId(), invoice.getCustomer().getName(), invoice.getCustomer().getEmail()),
                invoice.getPeriodStart(),
                invoice.getPeriodEnd(),
                invoice.getInvoiceDate(),
                invoice.getDueDate(),
                invoice.isOverdue(),
                lines,
                discountRef,
                formatMoney(invoice.getSubtotal()),
                formatMoney(invoice.getTaxTotal()),
                formatMoney(invoice.getDiscountTotal()),
                formatMoney(invoice.getTotal()),
                formatMoney(invoice.getPaidAmount()),
                formatMoney(invoice.getAmountLeft()),
                allowedActions,
                payments
        );
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
