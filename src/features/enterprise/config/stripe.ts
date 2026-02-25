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
    monthly: 'price_BRONCE_MONTHLY',   // ← reemplazar con price_...
    yearly:  'price_BRONCE_YEARLY',    // ← reemplazar con price_...
  },
  plata: {
    monthly: 'price_PLATA_MONTHLY',    // ← reemplazar con price_...
    yearly:  'price_PLATA_YEARLY',     // ← reemplazar con price_...
  },
  oro: {
    monthly: 'price_ORO_MONTHLY',      // ← reemplazar con price_...
    yearly:  'price_ORO_YEARLY',       // ← reemplazar con price_...
  },
} as const;

/** Publishable key — safe to expose in frontend */
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
