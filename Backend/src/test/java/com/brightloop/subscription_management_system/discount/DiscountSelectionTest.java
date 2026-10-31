package com.brightloop.subscription_management_system.discount;

import com.brightloop.subscription_management_system.discount.dto.DiscountContext;
import com.brightloop.subscription_management_system.discount.dto.DiscountResult;
import com.brightloop.subscription_management_system.discount.entity.Discount;
import com.brightloop.subscription_management_system.discount.entity.DiscountAppliesTo;
import com.brightloop.subscription_management_system.discount.entity.DiscountType;
import com.brightloop.subscription_management_system.discount.repository.DiscountRepository;
import com.brightloop.subscription_management_system.discount.service.DiscountSelectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscountSelectionTest {

    @Mock
    private DiscountRepository discountRepository;

    @InjectMocks
    private DiscountSelectionService selectionService;

    private LocalDate today;

    @BeforeEach
    void setUp() {
        today = LocalDate.now();
    }

    @Test
    @DisplayName("Should evaluate percentage discount and allocate across lines")
    void testPercentDiscountEvaluation() {
        Discount d = new Discount();
        d.setId(1L);
        d.setName("10% Off Subscription");
        d.setType(DiscountType.PERCENT);
        d.setDiscountValue(new BigDecimal("10.00"));
        d.setAppliesTo(DiscountAppliesTo.SUBSCRIPTION);
        d.setStartDate(today.minusDays(5));
        d.setEndDate(today.plusDays(5));
        d.setActive(true);

        DiscountContext ctx = new DiscountContext(today, List.of(
                new DiscountContext.Line(10L, 2, new BigDecimal("1000.00")),
                new DiscountContext.Line(20L, 1, new BigDecimal("500.00"))
        ));

        Optional<DiscountResult> result = selectionService.evaluate(d, ctx);
        assertTrue(result.isPresent());
        DiscountResult dr = result.get();
        // 10% of 1500 = 150.00
        assertEquals(new BigDecimal("150.00"), dr.amount());
        assertEquals(2, dr.lineAllocations().size());
        // 1000/1500 * 150 = 100.00, remaining = 50.00
        assertEquals(new BigDecimal("100.00"), dr.lineAllocations().get(0));
        assertEquals(new BigDecimal("50.00"), dr.lineAllocations().get(1));
    }

    @Test
    @DisplayName("Should reject discount when minimum purchase is not met")
    void testMinPurchaseCondition() {
        Discount d = new Discount();
        d.setId(2L);
        d.setName("Big Spender");
        d.setType(DiscountType.FIXED);
        d.setDiscountValue(new BigDecimal("200.00"));
        d.setAppliesTo(DiscountAppliesTo.SUBSCRIPTION);
        d.setMinPurchase(new BigDecimal("5000.00"));
        d.setStartDate(today.minusDays(5));
        d.setEndDate(today.plusDays(5));
        d.setActive(true);

        DiscountContext ctx = new DiscountContext(today, List.of(
                new DiscountContext.Line(10L, 1, new BigDecimal("4000.00"))
        ));

        Optional<DiscountResult> result = selectionService.evaluate(d, ctx);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should reject expired or exhausted discount")
    void testExpiredOrExhausted() {
        Discount dExpired = new Discount();
        dExpired.setType(DiscountType.PERCENT);
        dExpired.setDiscountValue(new BigDecimal("10.00"));
        dExpired.setAppliesTo(DiscountAppliesTo.SUBSCRIPTION);
        dExpired.setStartDate(today.minusDays(10));
        dExpired.setEndDate(today.minusDays(1)); // Expired yesterday
        dExpired.setActive(true);

        DiscountContext ctx = new DiscountContext(today, List.of(
                new DiscountContext.Line(10L, 1, new BigDecimal("1000.00"))
        ));

        assertFalse(selectionService.evaluate(dExpired, ctx).isPresent());

        Discount dExhausted = new Discount();
        dExhausted.setType(DiscountType.PERCENT);
        dExhausted.setDiscountValue(new BigDecimal("10.00"));
        dExhausted.setAppliesTo(DiscountAppliesTo.SUBSCRIPTION);
        dExhausted.setStartDate(today.minusDays(1));
        dExhausted.setEndDate(today.plusDays(10));
        dExhausted.setUsageLimit(5);
        dExhausted.setUsedCount(5); // Exhausted
        dExhausted.setActive(true);

        assertFalse(selectionService.evaluate(dExhausted, ctx).isPresent());
    }

    @Test
    @DisplayName("Should select the discount that yields the highest savings")
    void testBestOfTwoDiscounts() {
        Discount d10Percent = new Discount();
        d10Percent.setId(1L);
        d10Percent.setName("10% Off");
        d10Percent.setType(DiscountType.PERCENT);
        d10Percent.setDiscountValue(new BigDecimal("10.00"));
        d10Percent.setAppliesTo(DiscountAppliesTo.SUBSCRIPTION);
        d10Percent.setStartDate(today.minusDays(1));
        d10Percent.setEndDate(today.plusDays(10));
        d10Percent.setActive(true);

        Discount dFixed50 = new Discount();
        dFixed50.setId(2L);
        dFixed50.setName("50 Fixed Off");
        dFixed50.setType(DiscountType.FIXED);
        dFixed50.setDiscountValue(new BigDecimal("50.00"));
        dFixed50.setAppliesTo(DiscountAppliesTo.SUBSCRIPTION);
        dFixed50.setStartDate(today.minusDays(1));
        dFixed50.setEndDate(today.plusDays(10));
        dFixed50.setActive(true);

        when(discountRepository.findCandidates(today)).thenReturn(List.of(d10Percent, dFixed50));

        // For total of 1000, 10% = 100 which is > 50
        DiscountContext ctx = new DiscountContext(today, List.of(
                new DiscountContext.Line(10L, 1, new BigDecimal("1000.00"))
        ));

        Optional<DiscountResult> best = selectionService.findBest(ctx);
        assertTrue(best.isPresent());
        assertEquals(1L, best.get().discountId());
        assertEquals(new BigDecimal("100.00"), best.get().amount());
    }
}
