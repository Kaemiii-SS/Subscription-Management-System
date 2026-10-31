
package com.brightloop.subscription_management_system.subscription.service;

import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.catalog.entity.Product;
import com.brightloop.subscription_management_system.catalog.entity.ProductVariant;
import com.brightloop.subscription_management_system.catalog.repository.PlanRepository;
import com.brightloop.subscription_management_system.catalog.repository.ProductRepository;
import com.brightloop.subscription_management_system.subscription.dto.QuotationTemplateRequest;
import com.brightloop.subscription_management_system.subscription.dto.QuotationTemplateResponse;
import com.brightloop.subscription_management_system.subscription.entity.QuotationTemplate;
import com.brightloop.subscription_management_system.subscription.entity.QuotationTemplateLine;
import com.brightloop.subscription_management_system.subscription.repository.QuotationTemplateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuotationTemplateService {

    private final QuotationTemplateRepository templateRepository;
    private final PlanRepository planRepository;
    private final ProductRepository productRepository;

    public QuotationTemplateResponse create(QuotationTemplateRequest request) {

        Plan plan = getActivePlan(request.planId());

        QuotationTemplate template = new QuotationTemplate();
        template.setName(request.name());
        template.setValidityDays(request.validityDays());
        template.setPlan(plan);
        template.setActive(true);

        addLines(template, request);

        return mapToResponse(templateRepository.save(template));
    }

    public QuotationTemplateResponse update(
            Long id,
            QuotationTemplateRequest request
    ) {

        QuotationTemplate template = getTemplate(id);
        Plan plan = getActivePlan(request.planId());

        template.setName(request.name());
        template.setValidityDays(request.validityDays());
        template.setPlan(plan);

        template.clearLines();
        addLines(template, request);

        return mapToResponse(templateRepository.save(template));
    }

    @Transactional(readOnly = true)
    public QuotationTemplateResponse getById(Long id) {
        return mapToResponse(getTemplate(id));
    }

    @Transactional(readOnly = true)
    public Page<QuotationTemplateResponse> getAll(Pageable pageable) {
        return templateRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    public void deactivate(Long id) {
        QuotationTemplate template = getTemplate(id);
        template.setActive(false);
        templateRepository.save(template);
    }

    private void addLines(
            QuotationTemplate template,
            QuotationTemplateRequest request
    ) {

        for (QuotationTemplateRequest.TemplateLineRequest lineRequest
                : request.lines()) {

            Product product = productRepository.findById(lineRequest.productId())
                    .orElseThrow(() ->
                            new EntityNotFoundException(
                                    "Product not found: " + lineRequest.productId()
                            ));

            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new IllegalArgumentException(
                        "Product is inactive: " + product.getName()
                );
            }

            ProductVariant variant = null;

            if (lineRequest.variantId() != null) {
                variant = product.getVariants().stream()
                        .filter(v -> v.getId().equals(lineRequest.variantId()))
                        .findFirst()
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Variant does not belong to product: "
                                                + lineRequest.variantId()
                                ));
            }

            QuotationTemplateLine line = new QuotationTemplateLine();
            line.setProduct(product);
            line.setVariant(variant);
            line.setQuantity(lineRequest.quantity());

            template.addLine(line);
        }
    }

    private Plan getActivePlan(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Plan not found: " + id));

        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new IllegalArgumentException("Plan is inactive");
        }

        return plan;
    }

    private QuotationTemplate getTemplate(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Quotation template not found: " + id
                        ));
    }

    private QuotationTemplateResponse mapToResponse(
            QuotationTemplate template
    ) {

        List<QuotationTemplateResponse.TemplateLineResponse> lines =
                template.getLines().stream()
                        .map(line ->
                                new QuotationTemplateResponse.TemplateLineResponse(
                                        line.getId(),
                                        line.getProduct().getId(),
                                        line.getProduct().getName(),
                                        line.getVariant() != null
                                                ? line.getVariant().getId()
                                                : null,
                                        line.getQuantity()
                                ))
                        .toList();

        return new QuotationTemplateResponse(
                template.getId(),
                template.getName(),
                template.getValidityDays(),
                template.getPlan().getId(),
                template.getPlan().getName(),
                template.getActive(),
                lines,
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
