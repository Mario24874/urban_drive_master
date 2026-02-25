// Invoice and billing types for the enterprise layer

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'paypal' | 'other';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
  taxRatePercent?: number;
}

export interface PaymentAttempt {
  id: string;
  invoiceId: string;
  amountUsd: number;
  method: PaymentMethod;
  status: 'pending' | 'succeeded' | 'failed';
  attemptedAt: Date;
  failureReason?: string;
  externalPaymentId?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  subscriptionId: string;
  number: string;           // human-readable invoice number
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotalUsd: number;
  taxUsd: number;
  totalUsd: number;
  currency: string;         // ISO 4217, e.g. 'USD'
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  paymentAttempts: PaymentAttempt[];
  externalInvoiceId?: string; // e.g. Stripe invoice ID
  pdfUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingSummary {
  totalPaidUsd: number;
  totalPendingUsd: number;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  invoiceCount: number;
}
