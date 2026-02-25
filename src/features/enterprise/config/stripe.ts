/**
 * Stripe Price IDs
 *
 * ⚠️  Replace each placeholder with the real price_... value from Stripe Dashboard:
 *     Products → select product → Pricing section → copy Price ID (starts with price_)
 *
 * Product IDs (for reference only — NOT used in checkout):
 *   Bronce:       prod_U2tcT6Ms6M3eJp
 *   Plata:        prod_U2tf6CScAYoU5s
 *   Oro:          prod_U2tgkCCkE2sD8C
 *   Bronce anual: prod_U2tkI8o4CupWoC
 *   Plata anual:  prod_U2tl2YKhkiCDx8
 *   Oro anual:    prod_U2tmstVi24k5Am
 */
export const STRIPE_PRICE_IDS = {
  bronce: {
    monthly: 'price_1T4npQB2WAG0h7ZP3FoSzeub',
    yearly:  'price_1T4nx6B2WAG0h7ZPCe8k2700',
  },
  plata: {
    monthly: 'price_1T4nsDB2WAG0h7ZPCmamsZGT',
    yearly:  'price_1T4nxvB2WAG0h7ZPKXwVlx5M',
  },
  oro: {
    monthly: 'price_1T4ntQB2WAG0h7ZPXd5ipCOT',
    yearly:  'price_1T4nygB2WAG0h7ZPrHdrCcTb',
  },
} as const;

/** Publishable key — safe to expose in frontend */
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
