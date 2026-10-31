package com.brightloop.subscription_management_system.discount.repository;

import com.brightloop.subscription_management_system.discount.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Long>, JpaSpecificationExecutor<Discount> {

    @Query("""
            select d from Discount d
            where d.active = true
              and d.startDate <= :today
              and d.endDate >= :today
              and (d.usageLimit is null or d.usedCount < d.usageLimit)
            """)
    List<Discount> findCandidates(@Param("today") LocalDate today);

    // Atomic "use one slot": updates 0 rows if the discount is used up or inactive
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Discount d set d.usedCount = d.usedCount + 1
            where d.id = :id
              and d.active = true
              and (d.usageLimit is null or d.usedCount < d.usageLimit)
            """)
    int tryUseSlot(@Param("id") Long id);

    // Revert slot when invoice is cancelled
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Discount d set d.usedCount = d.usedCount - 1
            where d.id = :id and d.usedCount > 0
            """)
    int revertSlot(@Param("id") Long id);
}