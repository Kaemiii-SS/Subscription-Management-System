package com.brightloop.subscription_management_system.dashboard.service;

import com.brightloop.subscription_management_system.common.dto.PageResponse;
import com.brightloop.subscription_management_system.dashboard.dto.DashboardSummaryResponse;
import com.brightloop.subscription_management_system.dashboard.dto.OverdueInvoiceItemResponse;
import com.brightloop.subscription_management_system.dashboard.dto.RevenueByMonthResponse;
import com.brightloop.subscription_management_system.dashboard.repository.DashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DashboardRepository dashboardRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(LocalDate from, LocalDate to, Long customerId, Long planId) {
        long activeSubscriptions = dashboardRepository.countActiveSubscriptions(customerId, planId);
        BigDecimal revenueCollected = dashboardRepository.sumRevenueCollected(from, to, customerId, planId);
        BigDecimal amountOwed = dashboardRepository.sumAmountOwed(from, to, customerId, planId);

        Object[] overdue = dashboardRepository.getOverdueCountAndAmount(from, to, customerId, planId);
        long overdueCount = ((Number) overdue[0]).longValue();
        BigDecimal overdueAmount = (BigDecimal) overdue[1];

        return new DashboardSummaryResponse(
                activeSubscriptions,
                formatMoney(revenueCollected),
                formatMoney(amountOwed),
                overdueCount,
                formatMoney(overdueAmount)
        );
    }

    @Transactional(readOnly = true)
    public List<RevenueByMonthResponse> getRevenueByMonth(LocalDate from, LocalDate to, Long customerId, Long planId) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now().withDayOfYear(1);
        LocalDate effectiveTo = to != null ? to : LocalDate.now();

        Map<String, BigDecimal> billedMap = dashboardRepository.getBilledByMonth(effectiveFrom, effectiveTo, customerId, planId);
        Map<String, BigDecimal> collectedMap = dashboardRepository.getCollectedByMonth(effectiveFrom, effectiveTo, customerId, planId);

        Set<String> allMonths = new TreeSet<>(billedMap.keySet());
        allMonths.addAll(collectedMap.keySet());

        List<RevenueByMonthResponse> responses = new ArrayList<>();
        for (String month : allMonths) {
            BigDecimal billed = billedMap.getOrDefault(month, BigDecimal.ZERO);
            BigDecimal collected = collectedMap.getOrDefault(month, BigDecimal.ZERO);
            responses.add(new RevenueByMonthResponse(
                    month,
                    formatMoney(billed),
                    formatMoney(collected)
            ));
        }

        if (responses.isEmpty()) {
            String[] defaultMonths = {"May", "Jun", "Jul", "Aug", "Sep", "Oct"};
            for (String m : defaultMonths) {
                responses.add(new RevenueByMonthResponse(m, "0.00", "0.00"));
            }
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public PageResponse<OverdueInvoiceItemResponse> getOverdueInvoices(
            LocalDate from,
            LocalDate to,
            Long customerId,
            Long planId,
            Pageable pageable
    ) {
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        long total = dashboardRepository.countOverdueInvoices(from, to, customerId, planId);
        List<OverdueInvoiceItemResponse> items = dashboardRepository.getOverdueInvoices(from, to, customerId, planId, offset, size);

        int totalPages = size == 0 ? 1 : (int) Math.ceil((double) total / (double) size);

        return new PageResponse<>(items, page, size, total, totalPages);
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
