package com.brightloop.subscription_management_system.catalog.service;

import com.brightloop.subscription_management_system.catalog.dto.TaxRequest;
import com.brightloop.subscription_management_system.catalog.dto.TaxResponse;
import com.brightloop.subscription_management_system.catalog.entity.Tax;
import com.brightloop.subscription_management_system.catalog.repository.TaxRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaxService {

    private final TaxRepository taxRepository;

    public TaxService(TaxRepository taxRepository) {
        this.taxRepository = taxRepository;
    }

    @Transactional
    public TaxResponse createTax(TaxRequest request) {

        if (taxRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new IllegalArgumentException("Tax name already exists");
        }

        Tax tax = new Tax();
        tax.setName(request.name().trim());
        tax.setPercent(request.percent());
        tax.setActive(true);

        return mapToResponse(taxRepository.save(tax));
    }

    @Transactional(readOnly = true)
    public Page<TaxResponse> getAllTaxes(Pageable pageable) {

        return taxRepository.findByActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public TaxResponse updateTax(Long id, TaxRequest request) {

        Tax tax = taxRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Tax not found")
                );

        taxRepository.findByNameIgnoreCase(request.name().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Tax name already exists");
                });

        tax.setName(request.name().trim());
        tax.setPercent(request.percent());

        return mapToResponse(taxRepository.save(tax));
    }

    @Transactional
    public void deactivateTax(Long id) {

        Tax tax = taxRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Tax not found")
                );

        tax.setActive(false);
        taxRepository.save(tax);
    }

    private TaxResponse mapToResponse(Tax tax) {

        return new TaxResponse(
                tax.getId(),
                tax.getName(),
                tax.getPercent(),
                tax.getActive()
        );
    }
}