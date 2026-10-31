package com.brightloop.subscription_management_system.discount.controller;

import com.brightloop.subscription_management_system.discount.dto.DiscountPageResponse;
import com.brightloop.subscription_management_system.discount.dto.DiscountRequest;
import com.brightloop.subscription_management_system.discount.dto.DiscountResponse;
import com.brightloop.subscription_management_system.discount.service.DiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountService discountService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public DiscountPageResponse list(@RequestParam(required = false) Boolean active,
                                     @RequestParam(required = false) Boolean expired,
                                     @PageableDefault(size = 20) Pageable pageable) {
        return discountService.list(active, expired, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public DiscountResponse get(@PathVariable Long id) {
        return discountService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DiscountResponse create(@Valid @RequestBody DiscountRequest request) {
        return discountService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DiscountResponse update(@PathVariable Long id, @Valid @RequestBody DiscountRequest request) {
        return discountService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivate(@PathVariable Long id) {
        discountService.deactivate(id);
    }
}