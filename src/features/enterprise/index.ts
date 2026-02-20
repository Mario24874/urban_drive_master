/**
 * Urban Drive — Enterprise Feature Module
 *
 * Public API for the enterprise subscription layer.
 * Import everything from '@/features/enterprise'.
 *
 * Implementation status:
 *   ✅ Phase 1 — Types + Firestore schema + security rules
 *   🔜 Phase 2 — Company onboarding wizard + useCompany / useSubscription hooks
 *   🔜 Phase 3 — Dashboard + fleet map
 *   🔜 Phase 4 — Payment integration (MercadoPago first, then Stripe / PayU)
 *   🔜 Phase 5 — Per-modality feature modules
 */

// ─── Types ─────────────────────────────────────────────────────────────────
export * from './types';

// ─── Hooks ─────────────────────────────────────────────────────────────────
export { useFeatureGate, checkNumericLimit, checkBooleanFeature } from './hooks/useFeatureGate';

// ─── Future exports (added as phases are implemented) ──────────────────────
// Phase 2:
//   export { useCompany }    from './hooks/useCompany';
//   export { useSubscription } from './hooks/useSubscription';
//   export { useFleet }      from './hooks/useFleet';
//   export { CompanyContext, CompanyProvider, useCompanyContext } from './context/CompanyContext';
//
// Phase 3:
//   export { CompanyDashboard } from './components/CompanyDashboard';
//   export { FleetMap }         from './components/FleetMap';
//   export { DriverList }       from './components/DriverList';
//   export { BillingPanel }     from './components/BillingPanel';
//   export { FeatureGate }      from './components/FeatureGate';
//   export { EnterprisePage }   from './pages/EnterprisePage';
//
// Phase 4:
//   export { useCheckout }    from './hooks/useCheckout';
//   export { CheckoutModal }  from './components/CheckoutModal';
//   export { PlanSelector }   from './components/PlanSelector';
