
package com.brightloop.subscription_management_system.subscription.repository;

import com.brightloop.subscription_management_system.subscription.entity.QuotationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface QuotationTemplateRepository
        extends JpaRepository<QuotationTemplate, Long>,
        JpaSpecificationExecutor<QuotationTemplate> {
}
