import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Shield, Crown, Sparkles } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { STRIPE_PRICE_IDS } from '../config/stripe';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier, SubscriptionBilling } from '../types/subscription';

interface PricingPlansProps {
  userId: string;
  currentTier?: SubscriptionTier;
  onClose: () => void;
}

// ─── Plan metadata ────────────────────────────────────────────────────────────
const PLAN_META: Record<Exclude<SubscriptionTier, 'free'>, {
  label: string;
  tagline: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  badge: string | null;
  accentText: string;
  accentBg: string;
  highlight: boolean;
}> = {
  bronce: {
    label: 'Bronce',
    tagline: 'Perfecto para conductores independientes',
    icon: <Zap size={22} />,
    gradient: 'from-amber-700 via-amber-600 to-orange-500',
    border: 'border-amber-500/40',
    badge: null,
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    highlight: false,
  },
  plata: {
    label: 'Plata',
    tagline: 'Ideal para flotas pequeñas y medianas',
    icon: <Shield size={22} />,
    gradient: 'from-slate-500 via-slate-400 to-gray-300',
    border: 'border-slate-400/60',
    badge: 'Recomendado',
    accentText: 'text-slate-300',
    accentBg: 'bg-slate-400/10',
    highlight: true,
  },
  oro: {
    label: 'Oro',
    tagline: 'Para operaciones de gran escala',
    icon: <Crown size={22} />,
    gradient: 'from-yellow-500 via-amber-400 to-yellow-300',
    border: 'border-yellow-400/50',
    badge: null,
    accentText: 'text-yellow-400',
    accentBg: 'bg-yellow-400/10',
    highlight: false,
  },
};

// ─── Feature rows ─────────────────────────────────────────────────────────────
interface FeatureRow {
  label: string;
  bronce: string | boolean;
  plata: string | boolean;
  oro: string | boolean;
}

const FEATURES: FeatureRow[] = [
  { label: 'Conductores',            bronce: 'hasta 3',       plata: 'hasta 20',       oro: 'Ilimitados' },
  { label: 'Vehículos',              bronce: 'hasta 3',       plata: 'hasta 20',       oro: 'Ilimitados' },
  { label: 'Modalidades',            bronce: '1',             plata: '3',              oro: 'Todas' },
  { label: 'Viajes activos',         bronce: 'hasta 20',      plata: 'hasta 200',      oro: 'Ilimitados' },
  { label: 'Seguimiento GPS',        bronce: true,            plata: true,             oro: true },
  { label: 'Chat con contactos',     bronce: true,            plata: true,             oro: true },
  { label: 'Estadísticas',           bronce: false,           plata: 'Básicas',        oro: 'Avanzadas' },
  { label: 'API REST',               bronce: false,           plata: false,            oro: true },
  { label: 'Marca personalizada',    bronce: false,           plata: false,            oro: true },
  { label: 'Soporte',                bronce: 'Email',         plata: 'Email prioritario', oro: 'Teléfono + Email' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function FeatureValue({ value, accent }: { value: string | boolean; accent: string }) {
  if (value === false) {
    return <span className="text-white/25 text-sm">—</span>;
  }
  if (value === true) {
    return <Check size={16} className={`${accent} flex-shrink-0`} />;
  }
  return <span className={`text-xs font-medium ${accent}`}>{value as string}</span>;
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard: React.FC<{
  tier: Exclude<SubscriptionTier, 'free'>;
  billing: SubscriptionBilling;
  isCurrent: boolean;
  onSelect: (tier: Exclude<SubscriptionTier, 'free'>) => void;
  loading: boolean;
}> = ({ tier, billing, isCurrent, onSelect, loading }) => {
  const meta = PLAN_META[tier];
  const plan = SUBSCRIPTION_PLANS[tier];
  const price = billing === 'monthly' ? plan.priceUsdPerMonth : Math.round(plan.priceUsdPerYear / 12);
  const totalYear = plan.priceUsdPerYear;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative flex flex-col rounded-2xl border p-5
        ${meta.border}
        ${meta.highlight
          ? 'bg-white/10 backdrop-blur-md shadow-2xl shadow-slate-400/20 ring-1 ring-slate-400/30'
          : 'bg-white/5 backdrop-blur-sm'}
      `}
    >
      {/* Recommended badge */}
      {meta.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 bg-gradient-to-r from-slate-400 to-gray-300 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            <Sparkles size={11} />
            {meta.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg`}>
          {meta.icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-lg leading-tight">{meta.label}</h3>
          <p className="text-white/50 text-xs leading-tight">{meta.tagline}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-white/50 text-sm self-start mt-1">USD</span>
          <span className={`text-4xl font-black ${meta.accentText}`}>${price}</span>
          <span className="text-white/50 text-sm mb-1">/mes</span>
        </div>
        {billing === 'yearly' && (
          <p className="text-white/40 text-xs mt-0.5">
            ${totalYear} facturado anualmente · ahorras ${plan.priceUsdPerMonth * 12 - totalYear}
          </p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2.5 flex-1 mb-5">
        {FEATURES.map((f) => {
          const val = f[tier];
          return (
            <div key={f.label} className="flex items-center justify-between gap-2">
              <span className="text-white/60 text-xs">{f.label}</span>
              <FeatureValue value={val} accent={meta.accentText} />
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={() => !isCurrent && onSelect(tier)}
        disabled={isCurrent || loading}
        className={`
          w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
          ${isCurrent
            ? 'bg-white/10 text-white/50 cursor-default border border-white/10'
            : `bg-gradient-to-r ${meta.gradient} text-white hover:opacity-90 active:scale-95 shadow-lg`
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Procesando...
          </span>
        ) : isCurrent ? (
          '✓ Plan actual'
        ) : (
          `Suscribirse a ${meta.label}`
        )}
      </button>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PricingPlans: React.FC<PricingPlansProps> = ({ userId, currentTier = 'free', onClose }) => {
  const { lang } = useApp();
  const [billing, setBilling] = useState<SubscriptionBilling>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSelectPlan = async (tier: Exclude<SubscriptionTier, 'free'>) => {
    const priceId = STRIPE_PRICE_IDS[tier][billing];

    if (priceId.startsWith('price_') === false || priceId.includes('PLACEHOLDER')) {
      toast.error('Configuración incompleta', {
        description: 'Los Price IDs de Stripe aún no han sido configurados.',
      });
      return;
    }

    setLoadingTier(tier);
    try {
      const functions = getFunctions();
      const createSession = httpsCallable<
        { priceId: string; userId: string; billing: string },
        { url: string }
      >(functions, 'createCheckoutSession');

      const result = await createSession({ priceId, userId, billing });
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Error al iniciar el pago', {
        description: err?.message ?? 'Intenta de nuevo',
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const tiers: Exclude<SubscriptionTier, 'free'>[] = ['bronce', 'plata', 'oro'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Background — same as main app */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/background.jpg)' }}
      />
      <div className="absolute inset-0 -z-10 bg-black/70" />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="h-9 w-9 rounded-xl shadow-lg" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Planes de suscripción</h1>
              <p className="text-white/50 text-xs">
                {lang === 'es' ? 'Para personas naturales y empresas' : 'For individuals and businesses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex-shrink-0 flex justify-center py-3 px-4">
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              billing === 'monthly'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              billing === 'yearly'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Anual
            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              −17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={billing}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2"
          >
            {tiers.map((tier) => (
              <PlanCard
                key={tier}
                tier={tier}
                billing={billing}
                isCurrent={currentTier === tier}
                onSelect={handleSelectPlan}
                loading={loadingTier === tier}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center py-6 space-y-1">
          <p className="text-white/30 text-xs">
            Sin compromisos · Cancela cuando quieras
          </p>
          <p className="text-white/20 text-xs flex items-center justify-center gap-1">
            Pagos seguros procesados por
            <span className="font-semibold text-white/30">Stripe</span>
          </p>
          {currentTier !== 'free' && (
            <p className="text-white/30 text-xs mt-2">
              Para cancelar o cambiar de plan, contacta soporte.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
