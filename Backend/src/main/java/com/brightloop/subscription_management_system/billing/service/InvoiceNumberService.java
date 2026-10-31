package com.brightloop.subscription_management_system.billing.service;

import com.brightloop.subscription_management_system.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class InvoiceNumberService {

    private final InvoiceRepository invoiceRepository;

    public String generate() {
        Long seq = invoiceRepository.getNextInvoiceSequence();
        int year = LocalDate.now().getYear();
        return String.format("INV-%d-%05d", year, seq);
    }
}
