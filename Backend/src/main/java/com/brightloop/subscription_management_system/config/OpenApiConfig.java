package com.brightloop.subscription_management_system.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Brightloop Subscription Management System API")
                        .description("Backend APIs for automated subscription lifecycle, billing jobs, invoice generation, payment processing, and financial dashboards.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Brightloop Engineering")
                                .email("support@brightloop.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .tags(List.of(
                        new Tag().name("Auth").description("User registration, login, and password management"),
                        new Tag().name("Catalog").description("Products, variants, plans, and tax configuration"),
                        new Tag().name("Discounts").description("Automated discount rules, usage quotas, and conditions"),
                        new Tag().name("Subscriptions").description("Quotation templates and subscription lifecycles"),
                        new Tag().name("Invoices").description("Automated invoice generation, PDF download, and actions"),
                        new Tag().name("Billing").description("Scheduled and manual billing job execution"),
                        new Tag().name("Payments").description("Safe payment recording and tracking"),
                        new Tag().name("Dashboard").description("Financial summaries, monthly revenue, and overdue tracking")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token obtained from `/api/auth/login` or `/api/v1/auth/login`")));
    }
}
