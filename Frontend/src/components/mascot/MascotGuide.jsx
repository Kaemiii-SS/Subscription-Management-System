import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Lightbulb } from 'lucide-react';

const PAGE_TIPS = {
  '/app/dashboard': {
    title: 'Finance Overview',
    message: "Hey! I'm Hop, your billing companion. Your recurring revenue is tracked in real-time. Notice any overdue invoices below? You can record payments directly from the table!",
    tag: 'Quick Action',
  },
  '/app/subscriptions': {
    title: 'Subscription Management',
    message: 'Hop tip: Subscriptions follow a strict lifecycle from Draft to Active. Click on any record to view its live status stepper and trigger allowed actions!',
    tag: 'Lifecycle Guide',
  },
  '/app/subscriptions/new': {
    title: 'Proposal Builder',
    message: 'Save time! Use the "Load from Quotation Template" dropdown above to pre-fill products and plans in 1 click, or add custom line items below.',
    tag: 'Pro Tip',
  },
  '/app/products': {
    title: 'Products & Variants',
    message: 'Did you know? You can add variants like "Brand = Odoo Edition (+560)" and the system calculates final prices live without floating number math!',
    tag: 'Catalog Helper',
  },
  '/app/plans': {
    title: 'Billing Cadence & Rules',
    message: 'Check the 4 switches on each plan: they decide whether subscriptions can pause, renew, or close early in both staff and customer portals.',
    tag: 'Policy Control',
  },
  '/app/invoices': {
    title: 'Invoicing & Settlements',
    message: 'Partially paid invoices show a visual progress bar. When an invoice reaches $0 balance due, it automatically transitions to Paid!',
    tag: 'Automated Billing',
  },
  '/app/templates': {
    title: 'Quotation Templates',
    message: 'Standardize sales agreements here. Click "Create Subscription" on any template to turn it into an active proposal immediately.',
    tag: 'Fast Track',
  },
  '/app/taxes': {
    title: 'Tax Engine',
    message: 'Configured tax rules automatically calculate percentages on every subscription quote and recurring invoice cycle.',
    tag: 'Compliance',
  },
  '/app/discounts': {
    title: 'Promotions & Coupons',
    message: 'You can see exactly how many times each coupon has been used (e.g. used 3 of 10) to keep volume discounts under control.',
    tag: 'Usage Quotas',
  },
  '/app/payments': {
    title: 'Payment Settlements',
    message: 'Every recorded wire transfer, card swipe, or UPI payment is logged here with full reference IDs and audit timestamps.',
    tag: 'Audit Ledger',
  },
  '/app/staff': {
    title: 'Team Onboarding',
    message: 'Only Administrators can access this area to invite new staff members and manage operations permissions.',
    tag: 'Admin Security',
  },
  '/portal/subscriptions': {
    title: 'Customer Self-Service',
    message: "Welcome to your portal! You can monitor your subscriptions and even pause or manage renewals without waiting for support replies.",
    tag: 'Self-Service',
  },
  '/portal/invoices': {
    title: 'Receipts & Statements',
    message: 'Review all historical invoices, check payment receipts, and download printable PDFs anytime.',
    tag: 'Statements',
  },
};

/**
 * Floating Interactive Mascot Guide that accompanies the user throughout the app.
 * Clicking the rabbit mascot toggles the contextual guidance speech bubble.
 */
export default function MascotGuide() {
  const location = useLocation();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsInfoOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsInfoOpen(false);
      }
    }

    if (isInfoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInfoOpen]);

  // Get current contextual tip based on route
  const currentPath = location.pathname;
  const currentTip =
    PAGE_TIPS[currentPath] || {
      title: "I'm with you!",
      message: "I'm Hop, your billing assistant! I'll guide you through managing products, invoices, and subscriptions effortlessly.",
      tag: 'Assistant Guide',
    };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-40 no-print flex flex-col items-end select-none pointer-events-none"
    >
      {/* Speech Bubble (pops up directly above Hop when clicked) */}
      {isInfoOpen && (
        <div className="mb-3 mr-1 max-w-xs sm:max-w-sm bg-[var(--surface-strong)] backdrop-blur-xl border border-[var(--border)] shadow-2xl rounded-2xl p-4 pointer-events-auto transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 relative">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-[var(--accent-soft)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                {currentTip.tag}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsInfoOpen(false)}
              className="text-textSecondary hover:text-textPrimary p-1 rounded-md hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              title="Close info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h5 className="text-xs font-bold text-textPrimary mb-1 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-warning" />
            {currentTip.title}
          </h5>

          <p className="text-[11px] text-textSecondary leading-relaxed">
            {currentTip.message}
          </p>

          <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-textSecondary">
            <span className="font-semibold flex items-center gap-1 text-accent">
              <Sparkles className="w-3 h-3 text-warning" />
              Hop Guide Mode
            </span>
            <button
              type="button"
              onClick={() => setIsInfoOpen(false)}
              className="text-accent hover:underline font-bold cursor-pointer"
            >
              Got it!
            </button>
          </div>

          {/* Little speech bubble tail pointing down to Hop */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[var(--surface-strong)] border-b border-r border-[var(--border)] rotate-45 transform"></div>
        </div>
      )}

      {/* Mascot Avatar Button - Click to open/close info */}
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className={`relative group p-1 bg-[var(--surface)] backdrop-blur-md border-2 ${
            isInfoOpen ? 'border-accent ring-4 ring-accent/30 scale-105' : 'border-[var(--border)] hover:border-accent'
          } shadow-xl rounded-2xl transition-all hover:scale-105 cursor-pointer`}
          title={isInfoOpen ? 'Click to close Hop info' : 'Click Hop for guidance & tips'}
        >
          <img
            src="/mascot.png"
            alt="Hop the Billing Bunny"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl drop-shadow-sm transition-transform duration-200 group-hover:rotate-2"
          />

          {/* Active Status Badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent border-2 border-[var(--bg-base)] items-center justify-center">
              <span className="w-1 h-1 bg-[#0b1a1a] rounded-full"></span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Inline Mascot Card for headers, empty states, or guided sections
 */
export function MascotBanner({ title, message, tip, action, className = '' }) {
  return (
    <div
      className={`bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4 ${className}`}
    >
      <div className="relative shrink-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-1 flex items-center justify-center shadow-xs">
          <img src="/mascot.png" alt="Hop Guide" className="w-full h-full object-contain" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-accent text-[#0b1a1a] text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[var(--border)]">
          Guide
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
          <h4 className="text-sm font-bold text-textPrimary">{title}</h4>
          {tip && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-accent border border-[var(--border)]">
              {tip}
            </span>
          )}
        </div>
        <p className="text-xs text-textSecondary leading-relaxed">{message}</p>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
