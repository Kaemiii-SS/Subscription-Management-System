package com.brightloop.subscription_management_system.config;

import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.catalog.entity.Product;
import com.brightloop.subscription_management_system.catalog.entity.Tax;
import com.brightloop.subscription_management_system.catalog.repository.PlanRepository;
import com.brightloop.subscription_management_system.catalog.repository.ProductRepository;
import com.brightloop.subscription_management_system.catalog.repository.TaxRepository;
import com.brightloop.subscription_management_system.user.entity.User;
import com.brightloop.subscription_management_system.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TaxRepository taxRepository;
    private final ProductRepository productRepository;
    private final PlanRepository planRepository;

    @Value("${app.admin.name:Sarah Connor}")
    private String adminName;

    @Value("${app.admin.email:admin@brightloop.com}")
    private String adminEmail;

    @Value("${app.admin.password:Password123!}")
    private String adminPassword;

    public AdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TaxRepository taxRepository,
            ProductRepository productRepository,
            PlanRepository planRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.taxRepository = taxRepository;
        this.productRepository = productRepository;
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCatalog();
    }

    private void seedUsers() {
        String defaultPwHash = passwordEncoder.encode("Password123!");

        // 1. Admin
        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
            User admin = new User();
            admin.setName(adminName != null ? adminName : "Sarah Connor");
            admin.setEmail(adminEmail.trim().toLowerCase());
            admin.setPasswordHash(defaultPwHash);
            admin.setRole("ADMIN");
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println("Initial ADMIN account created: " + adminEmail);
        }

        // 2. Staff
        if (!userRepository.existsByEmailIgnoreCase("staff@brightloop.com")) {
            User staff = new User();
            staff.setName("David Miller");
            staff.setEmail("staff@brightloop.com");
            staff.setPasswordHash(defaultPwHash);
            staff.setRole("STAFF");
            staff.setActive(true);
            userRepository.save(staff);
            System.out.println("Initial STAFF account created: staff@brightloop.com");
        }

        // 3. Customer
        if (!userRepository.existsByEmailIgnoreCase("customer@acme.com")) {
            User cust = new User();
            cust.setName("Alice Johnson");
            cust.setEmail("customer@acme.com");
            cust.setPasswordHash(defaultPwHash);
            cust.setRole("CUSTOMER");
            cust.setActive(true);
            userRepository.save(cust);
            System.out.println("Initial CUSTOMER account created: customer@acme.com");
        }
    }

    private void seedCatalog() {
        Tax standardTax = null;
        if (taxRepository.count() == 0) {
            standardTax = new Tax();
            standardTax.setName("Standard GST (18%)");
            standardTax.setPercent(new BigDecimal("18.00"));
            standardTax.setActive(true);
            standardTax = taxRepository.save(standardTax);

            Tax zeroTax = new Tax();
            zeroTax.setName("Zero Rate (0%)");
            zeroTax.setPercent(new BigDecimal("0.00"));
            zeroTax.setActive(true);
            taxRepository.save(zeroTax);
        } else {
            standardTax = taxRepository.findAll().stream().findFirst().orElse(null);
        }

        if (productRepository.count() == 0) {
            Product p1 = new Product();
            p1.setName("Brightloop Cloud ERP");
            p1.setType("Software");
            p1.setSalesPrice(new BigDecimal("1200.00"));
            p1.setCostPrice(new BigDecimal("300.00"));
            p1.setTax(standardTax);
            p1.setNotes("Enterprise subscription management and cloud ERP platform.");
            p1.setActive(true);
            productRepository.save(p1);

            Product p2 = new Product();
            p2.setName("Hop AI Copilot");
            p2.setType("AI Add-on");
            p2.setSalesPrice(new BigDecimal("49.00"));
            p2.setCostPrice(new BigDecimal("10.00"));
            p2.setTax(standardTax);
            p2.setNotes("AI assistant for recurring billing and customer insights.");
            p2.setActive(true);
            productRepository.save(p2);

            Product p3 = new Product();
            p3.setName("Priority 24/7 SLA");
            p3.setType("Support");
            p3.setSalesPrice(new BigDecimal("199.00"));
            p3.setCostPrice(new BigDecimal("50.00"));
            p3.setTax(standardTax);
            p3.setNotes("Guaranteed 1-hour SLA with dedicated solutions engineer.");
            p3.setActive(true);
            productRepository.save(p3);
        }

        if (planRepository.count() == 0) {
            Plan plan1 = new Plan();
            plan1.setName("Starter Monthly");
            plan1.setPrice(new BigDecimal("29.00"));
            plan1.setBillingPeriod("MONTHLY");
            plan1.setMinQuantity(1);
            plan1.setAvailableFrom(LocalDate.of(2026, 1, 1));
            plan1.setAutoClose(false);
            plan1.setClosable(true);
            plan1.setPausable(true);
            plan1.setRenewable(true);
            plan1.setActive(true);
            planRepository.save(plan1);

            Plan plan2 = new Plan();
            plan2.setName("Growth Monthly");
            plan2.setPrice(new BigDecimal("79.00"));
            plan2.setBillingPeriod("MONTHLY");
            plan2.setMinQuantity(1);
            plan2.setAvailableFrom(LocalDate.of(2026, 1, 1));
            plan2.setAutoClose(false);
            plan2.setClosable(true);
            plan2.setPausable(true);
            plan2.setRenewable(true);
            plan2.setActive(true);
            planRepository.save(plan2);

            Plan plan3 = new Plan();
            plan3.setName("Enterprise Annual");
            plan3.setPrice(new BigDecimal("899.00"));
            plan3.setBillingPeriod("YEARLY");
            plan3.setMinQuantity(1);
            plan3.setAvailableFrom(LocalDate.of(2026, 1, 1));
            plan3.setAutoClose(false);
            plan3.setClosable(true);
            plan3.setPausable(true);
            plan3.setRenewable(true);
            plan3.setActive(true);
            planRepository.save(plan3);
        }
    }
}