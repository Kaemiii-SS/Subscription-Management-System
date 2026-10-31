# Brightloop Software - Subscription Management System (Frontend)

A complete, production-grade frontend built on **React + Vite** for managing subscriptions, recurring billing cycles, product catalog variants, quotation templates, and automated invoicing.

Featuring **Hop**, your intelligent billing companion bunny with an active guidance system and a refreshed color palette.

---

## 🎨 Color Scheme Palette

The application uses a nature-inspired pastel palette:

| Key | Hex Code | Usage |
|---|---|---|
| **Background** | `#edf7f1` | Main application backdrop |
| **Surface** | `#f7fcf9` | Card surfaces, modals, data tables |
| **Primary** | `#16a34a` | Main call-to-actions, active links, primary buttons |
| **Secondary** | `#34d399` | Accents, gradients, subtle highlights |
| **Sage** | `#d1fae5` | Soft badges, selected states, pill backgrounds |
| **Mint** | `#6ee7b7` | Borders for badges, soft accent borders |
| **Teal** | `#5eead4` | Currency icons, payment indicators |
| **Amber** | `#fbbf24` | Paused statuses, balance warnings, tip icons |
| **Coral** | `#fb7185` | Overdue invoices, cancellations, destructive actions |
| **Lavender** | `#c4b5fd` | Confirmed proposal statuses, staff badges |
| **Text Primary** | `#1f2937` | High-contrast body and heading text |
| **Text Secondary** | `#6b7280` | Muted labels, metadata, subtitles |
| **Border** | `#dbe7df` | Subtle card borders, dividers, inputs |

---

## 🐰 Meet "Hop" - Your Always-On Assistant Guide

Hop is an interactive assistant embedded throughout Brightloop to guide staff, admins, and customers:

1. **Floating Companion (`MascotGuide`)**:
   - Anchored at the bottom-right of every page.
   - Detects the current page route and delivers contextual advice, tips, and shortcuts.
   - Expandable / collapsible speech bubble with a 1-click dismiss or minimize.
2. **Contextual Action Banners (`MascotBanner`)**:
   - **Dashboard**: Highlights overdue invoices and gives one-click navigation to the action center.
   - **Subscription Builder**: Explains how to load quotation templates and checks discounts in real-time.
   - **Subscription Detail**: Explains where the contract stands in the lifecycle stepper (`Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\rightarrow$ `Closed`).
   - **Customer Portal**: Confirms data isolation and guides self-service actions (pause, resume, statements).
3. **Empty States**:
   - Hop holds his tablet and guides users on how to create their first product, plan, or invoice.
4. **Header & Brand**:
   - Sidebar header, customer portal topbar, and login screens feature Hop as the friendly mascot.

---

## 🛠️ Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **App Framework** | React 18 + Vite | Fast HMR and lightweight bundle |
| **Routing** | React Router DOM v6 | Protected role-based client routing |
| **Server State & Data Fetching** | TanStack Query v5 | Automatic caching, refetching, and pagination |
| **HTTP Client** | Axios | Bearer token interceptor, 401/403 security handling |
| **Forms & Validation** | React Hook Form + Zod | Schema validation & live password complexity checklist |
| **Styling & Components** | Tailwind CSS + Lucide Icons | Responsive layout, modern UI cards, dialogs, steppers |
| **Financial Analytics** | Recharts | MRR revenue growth and telemetry charts |
| **Toasts & Feedback** | Sonner | Real-time user action notifications |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000` (or `http://localhost:5173`).

### 3. Build for Production
```bash
npm run build
```

---

## 👥 Demo Accounts & Pre-Seeded Profiles

For testing and hackathon evaluation, the app comes with three pre-configured accounts:

| Role | Name | Email | Password | Home Page |
|---|---|---|---|---|
| **Admin** | Sarah Connor | `admin@brightloop.com` | `Password123!` | `/app/dashboard` |
| **Staff** | David Miller | `staff@brightloop.com` | `Password123!` | `/app/dashboard` |
| **Customer** | Alice Johnson (Acme Corp) | `customer@acme.com` | `Password123!` | `/portal/subscriptions` |

> **Quick Switcher:** You can switch between roles instantly using the top bar **"Role Switcher"** dropdown or the login screen shortcuts without logging out.
