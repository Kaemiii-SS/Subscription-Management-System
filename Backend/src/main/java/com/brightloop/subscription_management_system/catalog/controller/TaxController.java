package com.brightloop.subscription_management_system.catalog.controller;

import com.brightloop.subscription_management_system.catalog.dto.TaxRequest;
import com.brightloop.subscription_management_system.catalog.dto.TaxResponse;
import com.brightloop.subscription_management_system.catalog.service.TaxService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import com.brightloop.subscription_management_system.common.dto.PageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin/taxes", "/api/v1/taxes", "/api/taxes"})
public class TaxController {

    private final TaxService taxService;

    public TaxController(TaxService taxService) {
        this.taxService = taxService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaxResponse createTax(@Valid @RequestBody TaxRequest request) {
        return taxService.createTax(request);
    }

    @GetMapping
    public PageResponse<TaxResponse> getAllTaxes(
            @PageableDefault(size = 50, sort = "name") Pageable pageable
    ) {
        return PageResponse.of(taxService.getAllTaxes(pageable));
    }

    @PutMapping("/{id}")
    public TaxResponse updateTax(
            @PathVariable Long id,
            @Valid @RequestBody TaxRequest request
    ) {
        return taxService.updateTax(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateTax(@PathVariable Long id) {
        taxService.deactivateTax(id);
    }
}