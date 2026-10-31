# Brightloop Subscription Management System

A robust, enterprise-grade Java backend that powers an end-to-end subscription business: catalog management, automated discount selection, quotation templates, subscription lifecycles, automated recurring billing jobs, invoice generation with PDF exports, safe payment processing with concurrency locking, and high-performance financial reporting dashboards.

---

## 🚀 Tech Stack

- **Java**: 25 (OpenJDK / Eclipse Temurin)
- **Framework**: Spring Boot 4.1.2
- **Persistence**: Spring Data JPA / Hibernate, PostgreSQL (Neon / Local Docker)
- **Database Migrations**: Flyway (Schema versioned migrations V1 to V6)
- **Security**: Spring Security 6 with JWT (stateless authentication, role-based RBAC)
- **PDF Generation**: OpenPDF (clean, fast, production-ready invoice rendering)
- **Documentation**: Springdoc OpenAPI / Swagger UI
- **Build Tool**: Maven 3.9+ with Maven Wrapper (`./mvnw`)
- **Containerization**: Docker & Docker Compose

---

## 🔒 Locked Business Rules & Architectural Guarantees

1. **Precision Monetary Calculations**:
   - All financial amounts use `BigDecimal` with a scale of 2 and `RoundingMode.HALF_UP`. Floating-point numbers (`float`, `double`) are strictly prohibited.
   - Database tables enforce `NUMERIC(14,2)` for money and `NUMERIC(5,2)` for tax percentages.

2. **Double-Billing Prevention**:
   - A PostgreSQL partial unique constraint (`uq_invoice_period` on `(subscription_id, period_start) WHERE status <> 'CANCELLED'`) prevents duplicate live invoices for the same subscription period.
   - The billing engine processes subscriptions period-by-period with catch-up capability for missed days.

3. **Discount Allocation & Slot Concurrency**:
   - Only **one** best eligible discount is applied per invoice (no stacking).
   - `DiscountSelectionService` calculates savings across eligible lines and allocates proportionally, assigning any residual cent to the last line.
   - `tryUseSlot` performs an atomic PostgreSQL update (`UPDATE ... WHERE used_count < usage_limit`), eliminating race conditions.
   - If an unpaid invoice is cancelled, the discount slot is automatically restored.

4. **Safe Payment Processing & Overpayment Protection**:
   - Payments acquire a pessimistic write lock (`SELECT ... FOR UPDATE`) on the invoice.
   - Partial payments are supported; payments exceeding the remaining balance are rejected.
   - When cumulative payments equal or exceed the invoice total, the invoice automatically transitions to `PAID`.

5. **Customer Ownership & Security Isolation**:
   - Customer IDs are always resolved from the verified JWT principal in the security context, never trusted from client request bodies.
   - If a customer attempts to query or access an invoice, subscription, or payment belonging to another user, the API responds with `404 Not Found` (never leaking existence).

6. **State Machines**:
   - Subscriptions: `DRAFT` ➔ `QUOTATION` ➔ `CONFIRMED` ➔ `ACTIVE` ➔ (`PAUSED` ⇄ `ACTIVE`) ➔ `CLOSED`.
   - Invoices: `DRAFT` ➔ `CONFIRMED` ➔ `PAID`, with `CANCELLED` permitted from `DRAFT` or `CONFIRMED` only when zero payments are recorded.

---

## 📁 Package Architecture

```text
com.brightloop.subscription_management_system/
├── admin/          # Admin staff management controllers
├── auth/           # Signup, login, JWT token generation, current user context
├── catalog/        # Products, variants, plans, tax definitions
├── discount/       # Discount entities, CRUD, and best-discount evaluation
├── subscription/   # Quotation templates, subscription lines, lifecycle service
├── billing/        # Invoices, invoice lines, discount usages, billing job worker, scheduler, PDF service
├── payment/        # Payments entity, safe payment recording, ledger
├── dashboard/      # Native SQL aggregated metrics, monthly revenue charts, overdue reporting
├── security/       # JWT authentication filter, token validation, user details service
├── config/         # Security configuration, OpenAPI/Swagger configuration, admin seeder
└── common/         # Standard error response, GlobalExceptionHandler, PageResponse
```

---

## 📋 API Endpoints Reference

Base path: `/api/v1` (also accessible via `/api`)

### 1. Authentication (`/api/v1/auth`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` (or `/api/auth/register`) | Public | Customer signup |
| POST | `/api/v1/auth/login` | Public | Obtain JWT token |
| POST | `/api/v1/auth/forgot-password` | Public | Request password reset token |
| POST | `/api/v1/auth/reset-password` | Public | Complete password reset |
| GET | `/api/auth/me` | Authenticated | Current user profile |

### 2. Catalog (`/api/admin`, `/api/catalog`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/admin/products` | ADMIN | Create product |
| GET | `/api/catalog/products` | All | Search and list products |
| POST | `/api/admin/products/{id}/variants` | ADMIN | Add variant (e.g. Brand: Odoo +560.00) |
| POST | `/api/admin/plans` | ADMIN | Create billing plan (Daily/Weekly/Monthly/Yearly) |
| GET | `/api/catalog/plans` | All | Search and list active plans |
| POST | `/api/admin/taxes` | ADMIN | Configure tax rate |

### 3. Discounts (`/api/v1/discounts`)
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/v1/discounts` | ADMIN, STAFF | Paged list with active/expired filters |
| GET | `/api/v1/discounts/{id}` | ADMIN, STAFF | Get discount details |
| POST | `/api/v1/discounts` | ADMIN | Create discount (Percentage or Fixed) |
| PUT | `/api/v1/discounts/{id}` | ADMIN | Edit discount |
| DELETE | `/api/v1/discounts/{id}` | ADMIN | Soft delete / deactivate discount |

### 4. Quotation Templates & Subscriptions
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/staff/quotation-templates` | ADMIN, STAFF | Create template with product lines |
| GET | `/api/staff/quotation-templates` | ADMIN, STAFF | List quotation templates |
| POST | `/api/customer/subscriptions` | CUSTOMER | Create subscription from template |
| GET | `/api/customer/subscriptions` | CUSTOMER | List own subscriptions |
| GET | `/api/staff/subscriptions` | ADMIN, STAFF | List all subscriptions |
| PATCH | `/api/staff/subscriptions/{id}/activate` | ADMIN, STAFF | Activate subscription |
| PATCH | `/api/staff/subscriptions/{id}/pause` | ADMIN, STAFF | Pause subscription |
| PATCH | `/api/staff/subscriptions/{id}/resume` | ADMIN, STAFF | Resume subscription (no catch-up bills) |
| PATCH | `/api/staff/subscriptions/{id}/close` | ADMIN, STAFF | Close subscription |
| GET | `/api/subscriptions/{id}/invoices` | Authenticated | List invoices for subscription |

### 5. Invoices & Billing (`/api/v1/invoices`, `/api/v1/billing`)
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/v1/invoices` | Authenticated | Paged list (filters: status, overdue, outstanding, search) |
| GET | `/api/v1/invoices/{id}` | Authenticated | Invoice detail with lines and `allowedActions` |
| POST | `/api/v1/invoices/{id}/actions/confirm` | ADMIN, STAFF | Confirm draft invoice |
| POST | `/api/v1/invoices/{id}/actions/cancel` | ADMIN, STAFF | Cancel invoice (restores discount slot) |
| POST | `/api/v1/invoices/{id}/actions/send` | ADMIN, STAFF | Mark sent & dispatch email |
| GET | `/api/v1/invoices/{id}/pdf` | Authenticated | Download formatted PDF invoice |
| GET | `/api/v1/invoices/{id}/payments` | Authenticated | View payments recorded on this invoice |
| POST | `/api/v1/billing/run` | ADMIN | Trigger billing job (optional `subscriptionId`) |

### 6. Payments (`/api/v1/payments`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/v1/invoices/{id}/payments` | ADMIN, STAFF | Record payment (UPI, CARD, CASH, BANK_TRANSFER) |
| GET | `/api/v1/payments` | Authenticated | List payments (customers view own only) |
| GET | `/api/v1/payments/{id}` | Authenticated | Get single payment detail |

### 7. Dashboard & Financial Reports (`/api/v1/dashboard`)
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/v1/dashboard/summary` | ADMIN, STAFF | Active subscriptions, revenue collected, amount owed, overdue |
| GET | `/api/v1/dashboard/revenue-by-month` | ADMIN, STAFF | Monthly billed vs collected comparison |
| GET | `/api/v1/dashboard/overdue-invoices` | ADMIN, STAFF | Paged list of overdue invoices with days late |

---

## 🏃 Running the Application

### Option A: Local Development
Ensure JDK 25 and PostgreSQL are available. Configure `.env` or pass environment variables:

```bash
# Build the project
./mvnw clean package

# Run the Spring Boot application
./mvnw spring-boot:run
```

Access Swagger UI at: `http://localhost:8080/swagger-ui.html`

### Option B: Docker Compose (One-command setup)
```bash
docker compose up --build
```
This launches both the PostgreSQL database container and the backend application with healthcheck integration.

---

## 🧪 Testing

Execute the comprehensive test suite covering business logic, state machines, concurrency, and financial calculations:

```bash
./mvnw test
```
