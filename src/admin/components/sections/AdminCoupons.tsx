/**
 * AdminCoupons — Coupon management section for the Admin Portal
 *
 * Generates, lists, copies and cancels Urban Drive discount coupons.
 * Coupons are stored in Firestore `discount_coupons/{code}`.
 *
 * Types:
 *   discount_10  → URBAN10-XXXXXXXX  → 10% off
 *   discount_50  → URBAN50-XXXXXXXX  → 50% off
 *   discount_100 → URBAN100-XXXXXXXX → 100% free (bypasses Stripe)
 */

import { useEffect, useState } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../../services/firebase';
import { useApp } from '../../../contexts/AppContext';
import { toast } from 'sonner';
import {
  Plus, Copy, XCircle, Ticket, RefreshCw, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CouponType = 'discount_10' | 'discount_50' | 'discount_100';
export type CouponStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface DiscountCoupon {
  id: string;        // Firestore doc ID (= code)
  code: string;
  type: CouponType;
  description: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: CouponStatus;
  usedAt?: Timestamp;
  usedBy?: string;
  cancelledAt?: Timestamp;
  cancelledReason?: string;
  notes?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode(type: CouponType): string {
  const prefix: Record<CouponType, string> = {
    discount_10:  'URBAN10',
    discount_50:  'URBAN50',
    discount_100: 'URBAN100',
  };
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix[type]}-${random}`;
}

function couponDescription(type: CouponType, t: (k: string) => string): string {
  const map: Record<CouponType, string> = {
    discount_10:  t('coupon10Desc'),
    discount_50:  t('coupon50Desc'),
    discount_100: t('coupon100Desc'),
  };
  return map[type];
}

function statusBadge(status: CouponStatus) {
  const map: Record<CouponStatus, string> = {
    active:    'bg-green-500/15 text-green-400 border-green-500/30',
    used:      'bg-slate-500/15 text-slate-400 border-slate-500/30',
    expired:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] ?? map.expired;
}

function typeBadge(type: CouponType) {
  const map: Record<CouponType, string> = {
    discount_10:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    discount_50:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
    discount_100: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return map[type];
}

function typeLabel(type: CouponType, t: (k: string) => string): string {
  const map: Record<CouponType, string> = {
    discount_10:  t('coupon10Label'),
    discount_50:  t('coupon50Label'),
    discount_100: t('coupon100Label'),
  };
  return map[type];
}

function fmtDate(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  const d = ts.toDate();
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpiredTs(ts: Timestamp): boolean {
  return ts.toDate() < new Date();
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminCoupons() {
  const { t } = useApp();

  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<DiscountCoupon | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Generate form state
  const [genType, setGenType] = useState<CouponType>('discount_10');
  const [genNotes, setGenNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'discount_coupons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: DiscountCoupon[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DiscountCoupon, 'id'>),
      }));

      // Auto-mark expired locally (UI only — Firestore rule doesn't auto-expire)
      const now = new Date();
      const updated = list.map((c) =>
        c.status === 'active' && c.expiresAt.toDate() < now
          ? { ...c, status: 'expired' as CouponStatus }
          : c
      );
      setCoupons(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const code = generateCode(genType);
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      );

      const data = {
        code,
        type: genType,
        description: couponDescription(genType, t),
        createdBy: auth.currentUser?.uid ?? 'admin',
        createdAt: now,
        expiresAt,
        status: 'active' as CouponStatus,
        notes: genNotes.trim() || '',
      };

      // Use code as document ID for easy lookup during validation
      await addDoc(collection(db, 'discount_coupons'), data);

      toast.success(t('couponGenerated'), { description: code });
      setShowModal(false);
      setGenNotes('');
      setGenType('discount_10');
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Error generating coupon');
    } finally {
      setGenerating(false);
    }
  };

  // ── Copy ──────────────────────────────────────────────────────────────────

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(code);
      toast.success(t('couponCopied'), { description: code });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'discount_coupons', cancelTarget.id), {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelledReason: cancelReason.trim() || 'Cancelled by admin',
      });
      toast.success(t('couponCancelled'));
      setCancelTarget(null);
      setCancelReason('');
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? 'Error cancelling coupon');
    } finally {
      setCancelling(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-xl font-bold">{t('adminCoupons')}</h1>
            <p className="text-sm text-muted-foreground">
              {coupons.length} {coupons.length === 1 ? 'cupón' : 'cupones'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('adminRefresh')}
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('couponGenerate')}
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{t('couponNoCoupons')}</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('couponType')}</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('couponExpires')}</th>
                  <th className="px-4 py-3 text-left font-semibold">Notas</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => {
                  const isActive = c.status === 'active' && !isExpiredTs(c.expiresAt);
                  const displayStatus: CouponStatus =
                    c.status === 'active' && isExpiredTs(c.expiresAt) ? 'expired' : c.status;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {c.code}
                        </span>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${typeBadge(c.type)}`}>
                          {typeLabel(c.type, t)}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadge(displayStatus)}`}>
                          {displayStatus}
                        </span>
                        {displayStatus === 'used' && c.usedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtDate(c.usedAt)}
                          </p>
                        )}
                      </td>
                      {/* Expires */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {fmtDate(c.expiresAt)}
                      </td>
                      {/* Notes */}
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                        {c.notes || '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopy(c.code)}
                            title={t('couponCopy')}
                            className="p-1.5 rounded hover:bg-accent transition-colors"
                          >
                            {copiedId === c.code
                              ? <Check className="h-4 w-4 text-green-400" />
                              : <Copy className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          {isActive && (
                            <button
                              onClick={() => { setCancelTarget(c); setCancelReason(''); }}
                              title={t('couponCancelCoupon')}
                              className="p-1.5 rounded hover:bg-accent transition-colors"
                            >
                              <XCircle className="h-4 w-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Generate Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{t('couponGenerate')}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('couponType')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['discount_10', 'discount_50', 'discount_100'] as CouponType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setGenType(type)}
                    className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                      genType === type
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                        : 'border-border text-muted-foreground hover:border-amber-500/50'
                    }`}
                  >
                    {typeLabel(type, t)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {couponDescription(genType, t)}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('couponNotes')}</label>
              <textarea
                value={genNotes}
                onChange={(e) => setGenNotes(e.target.value)}
                placeholder="Ej: Para cliente VIP Mario"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Expiry info */}
            <p className="text-xs text-muted-foreground">
              Vence en <strong>15 días</strong> desde la generación.
            </p>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  t('couponGenerate')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">{t('couponCancelCoupon')}</h2>
            <p className="text-sm text-muted-foreground">
              Código: <span className="font-mono text-foreground">{cancelTarget.code}</span>
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('couponCancelReason')}</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Razón de cancelación"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <RefreshCw className="h-4 w-4 animate-spin" /> : t('couponCancelCoupon')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
