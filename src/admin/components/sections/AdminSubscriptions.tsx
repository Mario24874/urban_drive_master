import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { RefreshCw, Search } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../../../features/enterprise/types/subscription';

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  trialing:  'bg-blue-500/15 text-blue-600 border-blue-500/30',
  past_due:  'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  canceled:  'bg-muted text-muted-foreground border-border',
  unpaid:    'bg-red-500/15 text-red-600 border-red-500/30',
  paused:    'bg-orange-500/15 text-orange-600 border-orange-500/30',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('adminSubscriptions')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('adminMRR')}: <span className="font-semibold text-foreground">${mrr.toLocaleString()}/mo</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('adminRefresh')}
        </Button>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} subscriptions shown</p>
    </div>
  );
}
