package com.brightloop.subscription_management_system.subscription.controller;

import com.brightloop.subscription_management_system.subscription.dto.QuotationTemplateRequest;
import com.brightloop.subscription_management_system.subscription.dto.QuotationTemplateResponse;
import com.brightloop.subscription_management_system.subscription.service.QuotationTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff/quotation-templates")
@RequiredArgsConstructor
public class QuotationTemplateController {

    private final QuotationTemplateService quotationTemplateService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuotationTemplateResponse create(
            @Valid @RequestBody QuotationTemplateRequest request
    ) {
        return quotationTemplateService.create(request);
    }

    @PutMapping("/{id}")
    public QuotationTemplateResponse update(
            @PathVariable Long id,
            @Valid @RequestBody QuotationTemplateRequest request
    ) {
        return quotationTemplateService.update(id, request);
    }

    @GetMapping("/{id}")
    public QuotationTemplateResponse getById(
            @PathVariable Long id
    ) {
        return quotationTemplateService.getById(id);
    }

    @GetMapping
    public Page<QuotationTemplateResponse> getAll(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return quotationTemplateService.getAll(pageable);
    }

    @PatchMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(
            @PathVariable Long id
    ) {
        quotationTemplateService.deactivate(id);
    }
}