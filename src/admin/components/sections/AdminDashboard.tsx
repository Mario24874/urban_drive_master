import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Users, Building2, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { SUBSCRIPTION_PLANS } from '../../../features/enterprise/types/subscription';
import type { SubscriptionTier } from '../../../features/enterprise/types/subscription';

const PLAN_COLORS: Record<string, string> = {
  free:   'bg-gray-400',
  bronce: 'bg-amber-600',
  plata:  'bg-slate-400',
  oro:    'bg-yellow-400',
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  bronce: SUBSCRIPTION_PLANS.bronce.priceUsdPerMonth,
  plata:  SUBSCRIPTION_PLANS.plata.priceUsdPerMonth,
  oro:    SUBSCRIPTION_PLANS.oro.priceUsdPerMonth,
};

export default function AdminDashboard() {
  const { t } = useApp();
  const { companies, subscriptions, loading, refresh, totalUsersCount, totalCompaniesCount } = useAdminData();

  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubs.reduce((sum, s) => {
    const price = PLAN_PRICES[s.tier] ?? 0;
    return sum + (s.billing === 'yearly' ? price : price);
  }, 0);

  const planCounts: Record<string, number> = { free: 0, bronce: 0, plata: 0, oro: 0 };
  for (const sub of subscriptions) {
    planCounts[sub.tier] = (planCounts[sub.tier] ?? 0) + 1;
  }
  const totalSubs = subscriptions.length || 1;

  const recentCompanies = [...companies]
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 5);

  const kpis = [
    { label: t('adminTotalUsers'), value: totalUsersCount, icon: Users, color: 'text-blue-500' },
    { label: t('adminTotalCompanies'), value: totalCompaniesCount, icon: Building2, color: 'text-emerald-500' },
    { label: t('adminActiveSubs'), value: activeSubs.length, icon: CreditCard, color: 'text-violet-500' },
    { label: t('adminMRR'), value: `$${mrr.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500' },
  ];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('adminDashboard')}</h1>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('adminRefresh')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-3xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['free','bronce','plata','oro'] as SubscriptionTier[]).map((tier) => {
              const count = planCounts[tier] ?? 0;
              const pct = Math.round((count / totalSubs) * 100);
              return (
                <div key={tier} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{tier === 'free' ? t('planFree') : t(`plan${tier.charAt(0).toUpperCase() + tier.slice(1)}`)}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PLAN_COLORS[tier]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent companies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('adminNoData')}</p>
            ) : (
              <div className="space-y-2">
                {recentCompanies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="text-sm font-medium truncate">{c.companyName}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {c.createdAt ? c.createdAt.toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
