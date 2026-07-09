import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { RefreshCw, Search, CheckCircle, Loader2, Download, FileText } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../../../features/enterprise/types/subscription';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'sonner';
import { exportToCSV, exportToPDF, type ExportColumn } from '../../utils/adminExport';
import type { AdminSubscriptionRow } from '../../hooks/useAdminData';

const STATUS_STYLES: Record<string, string> = {
  active:           'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  trialing:         'bg-blue-500/15 text-blue-600 border-blue-500/30',
  past_due:         'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  canceled:         'bg-muted text-muted-foreground border-border',
  unpaid:           'bg-red-500/15 text-red-600 border-red-500/30',
  paused:           'bg-orange-500/15 text-orange-600 border-orange-500/30',
  pending_transfer: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  bronce: SUBSCRIPTION_PLANS.bronce.priceUsdPerMonth,
  plata:  SUBSCRIPTION_PLANS.plata.priceUsdPerMonth,
  oro:    SUBSCRIPTION_PLANS.oro.priceUsdPerMonth,
};

export default function AdminSubscriptions() {
  const { t } = useApp();
  const { subscriptions, loading, refresh } = useAdminData();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<typeof subscriptions[0] | null>(null);

  const handleActivateTransfer = async () => {
    if (!activateTarget) return;
    setActivatingId(activateTarget.id);
    try {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(
        periodEnd.getMonth() + (activateTarget.billing === 'yearly' ? 12 : 1)
      );

      await updateDoc(doc(db, 'subscriptions', activateTarget.id), {
        status: 'active',
        currentPeriodStart: Timestamp.fromDate(now),
        currentPeriodEnd: Timestamp.fromDate(periodEnd),
        updatedAt: Timestamp.fromDate(now),
        activatedByAdmin: true,
      });

      toast.success(t('adminActivateTransferSuccess'));
      setActivateTarget(null);
      refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(t('adminActivateTransferError'), { description: message });
    } finally {
      setActivatingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subscriptions.filter((s) => {
      if (q && !s.ownerName.toLowerCase().includes(q)) return false;
      if (tierFilter !== 'all' && s.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [subscriptions, search, tierFilter, statusFilter]);

  const mrr = filtered
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + (PLAN_PRICES[s.tier] ?? 0), 0);

  const exportColumns: ExportColumn<AdminSubscriptionRow>[] = [
    { header: 'Subscriber', accessor: (s) => s.ownerName },
    { header: 'Plan', accessor: (s) => s.tier },
    { header: 'Billing', accessor: (s) => s.billing },
    { header: 'Status', accessor: (s) => s.status },
    { header: 'Est. $/mo', accessor: (s) => PLAN_PRICES[s.tier] ?? 0 },
    { header: 'Period end', accessor: (s) => s.currentPeriodEnd ? s.currentPeriodEnd.toLocaleDateString() : '' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t('adminSubscriptions')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('adminMRR')}: <span className="font-semibold text-foreground">${mrr.toLocaleString()}/mo</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV('urban-drive-subscriptions', filtered, exportColumns)}>
            <Download className="h-4 w-4 mr-2" />
            {t('adminExportCSV')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(t('adminSubscriptions'), filtered, exportColumns)}>
            <FileText className="h-4 w-4 mr-2" />
            {t('adminExportPDF')}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('adminRefresh')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('adminSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t('adminFilterByPlan')}</option>
          <option value="free">{t('planFree')}</option>
          <option value="bronce">{t('planBronce')}</option>
          <option value="plata">{t('planPlata')}</option>
          <option value="oro">{t('planOro')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t('adminFilterByStatus')}</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="pending_transfer">Pending transfer</option>
        </select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Subscriber</th>
              <th className="text-left px-3 py-2 font-medium">Plan</th>
              <th className="text-left px-3 py-2 font-medium">Billing</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-right px-3 py-2 font-medium hidden md:table-cell">Est. $</th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Period end</th>
              <th className="text-center px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-medium truncate max-w-[160px]">{s.ownerName || '—'}</td>
                <td className="px-3 py-2 capitalize">{s.tier}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{s.billing}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_STYLES[s.status] ?? STATUS_STYLES.canceled}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right hidden md:table-cell">
                  ${PLAN_PRICES[s.tier] ?? 0}
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                  {s.currentPeriodEnd ? s.currentPeriodEnd.toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  {s.status === 'pending_transfer' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                      onClick={() => setActivateTarget(s)}
                      disabled={activatingId === s.id}
                    >
                      {activatingId === s.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><CheckCircle className="h-3 w-3 mr-1" />{t('adminActivateTransfer')}</>
                      }
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} subscriptions shown</p>

      {/* Bank transfer activation dialog */}
      <Dialog open={!!activateTarget} onOpenChange={(v) => { if (!v) setActivateTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('adminActivateTransferTitle')}</DialogTitle>
            <DialogDescription>{t('adminActivateTransferDesc')}</DialogDescription>
          </DialogHeader>
          {activateTarget && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Subscriber</span>
                <span className="font-medium">{activateTarget.ownerName || activateTarget.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium capitalize">{activateTarget.tier} — {activateTarget.billing}</span>
              </div>
              {activateTarget.transferReference && (
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">{t('adminActivateTransferRef')}</span>
                  <span className="font-mono text-xs">{activateTarget.transferReference}</span>
                </div>
              )}
              {activateTarget.transferAmount != null && (
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">{t('adminActivateTransferAmount')}</span>
                  <span className="font-medium">
                    ${activateTarget.transferAmount.toFixed(2)} {activateTarget.transferCurrency ?? 'USD'}
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="ghost" onClick={() => setActivateTarget(null)} className="w-full sm:w-auto">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleActivateTransfer}
              disabled={!!activatingId}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {activatingId ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {t('adminActivateTransferConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
