/**
 * Invoice / billing history types for Urban Drive Enterprise
 *
 * Stored in Firestore: billingHistory/{invoiceId}
 * Each document represents one billing event (charge, refund, credit, etc.).
 */

import type { PaymentProvider, SubscriptionTier, BillingCycle } from './subscription';

// ─── Invoice status ────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'      // Generated but not yet sent
  | 'open'       // Awaiting payment
  | 'paid'       // Payment confirmed
  | 'void'       // Canceled before payment
  | 'refunded'   // Full refund applied
  | 'partial';   // Partial refund applied

export type InvoiceType =
  | 'subscription'  // Recurring plan charge
  | 'addon'         // One-time or recurring add-on
  | 'setup_fee'     // Onboarding / activation fee
  | 'adjustment'    // Manual credit / debit
  | 'refund';       // Money back to customer

// ─── Line items ────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
  taxRate?: number;          // 0–1 (e.g. 0.19 for 19% IVA)
  taxAmountCents?: number;
}

// ─── Payment attempt ──────────────────────────────────────────────────────

export type PaymentAttemptStatus = 'pending' | 'succeeded' | 'failed';

export interface PaymentAttempt {
  provider: PaymentProvider;
  externalPaymentId: string;
  status: PaymentAttemptStatus;
  attemptedAt: Date;
  errorCode?: string;
  errorMessage?: string;
}

// ─── Invoice document (Firestore: billingHistory/{invoiceId}) ─────────────

export interface Invoice {
  id: string;
  companyId: string;
  subscriptionId: string;

  type: InvoiceType;
  status: InvoiceStatus;

  // Billing context
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  periodStart: Date;
  periodEnd: Date;

  // Amounts (in cents to avoid float issues)
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  refundedCents: number;
  currency: 'USD' | 'COP' | 'MXN' | 'ARS' | 'BRL';

  // Line items
  lineItems: InvoiceLineItem[];

  // Payment
  paymentAttempts: PaymentAttempt[];
  paidAt?: Date;

  // External IDs
  externalInvoiceId?: string;   // Provider's invoice ID
  externalPaymentId?: string;   // Last successful payment ID

  // PDF / receipt
  pdfUrl?: string;

  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateInvoiceInput = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Billing summary (computed, not stored) ───────────────────────────────

export interface BillingSummary {
  currentBalance: number;          // Negative = amount owed
  nextInvoiceDate: Date;
  nextInvoiceEstimateCents: number;
  totalPaidCents: number;
  totalRefundedCents: number;
  invoiceCount: number;
}
