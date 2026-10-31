package com.brightloop.subscription_management_system.dashboard.controller;

import com.brightloop.subscription_management_system.common.dto.PageResponse;
import com.brightloop.subscription_management_system.dashboard.dto.DashboardSummaryResponse;
import com.brightloop.subscription_management_system.dashboard.dto.OverdueInvoiceItemResponse;
import com.brightloop.subscription_management_system.dashboard.dto.RevenueByMonthResponse;
import com.brightloop.subscription_management_system.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/dashboard", "/api/dashboard"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping({"/summary", "/metrics"})
    public DashboardSummaryResponse getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long planId
    ) {
        return dashboardService.getSummary(from, to, customerId, planId);
    }

    @GetMapping({"/revenue-by-month", "/revenue-chart"})
    public List<RevenueByMonthResponse> getRevenueByMonth(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long planId
    ) {
        return dashboardService.getRevenueByMonth(from, to, customerId, planId);
    }

    @GetMapping("/overdue-invoices")
    public PageResponse<OverdueInvoiceItemResponse> getOverdueInvoices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long planId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return dashboardService.getOverdueInvoices(from, to, customerId, planId, pageable);
    }
}
