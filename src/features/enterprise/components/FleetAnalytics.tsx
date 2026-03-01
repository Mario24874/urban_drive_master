import React from 'react';
import { X, BarChart2, Lock } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useFleetAnalytics } from '../hooks/useFleetAnalytics';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier } from '../types/subscription';

interface FleetAnalyticsProps {
  companyId: string;
  userId: string;
  subscriptionTier: SubscriptionTier;
  onClose: () => void;
  onUpgrade?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sedan: 'Sedán',
  suv: 'SUV',
  van: 'Van',
  truck: 'Camión',
  motorcycle: 'Moto',
  bicycle: 'Bicicleta',
  bus: 'Bus',
  minibus: 'Minibús',
  other: 'Otro',
};

const ENTITY_LABELS: Record<string, string> = {
  company: 'Empresa',
  vehicle: 'Vehículos',
  driver: 'Conductores',
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(n);
}

const FleetAnalytics: React.FC<FleetAnalyticsProps> = ({
  companyId,
  subscriptionTier,
  onClose,
  onUpgrade,
}) => {
  const { t } = useApp();
  const analyticsLevel = SUBSCRIPTION_PLANS[subscriptionTier].analyticsLevel;
  const { loading, kpis, maintenanceStats, documentStats, fleetComposition } =
    useFleetAnalytics(analyticsLevel !== 'none' ? companyId : null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/background.jpg)' }}
      />
      <div className="absolute inset-0 -z-10 bg-black/75" />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <BarChart2 size={22} className="text-amber-400" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">{t('fleetAnalytics')}</h1>
              {analyticsLevel !== 'none' && (
                <p className="text-white/50 text-xs capitalize">{subscriptionTier}</p>
              )}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* ── Section A: Upgrade CTA (none) ── */}
        {analyticsLevel === 'none' && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <Lock size={32} className="text-white/50" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-2">{t('analyticsLockedTitle')}</h2>
              <p className="text-white/50 text-sm max-w-xs">{t('analyticsLockedDesc')}</p>
            </div>
            {onUpgrade && (
              <button
                onClick={() => { onClose(); onUpgrade(); }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold text-sm hover:opacity-90 transition-opacity"
              >
                {t('planUpgrade')}
              </button>
            )}
          </div>
        )}

        {/* ── Sections B–G: basic + advanced ── */}
        {analyticsLevel !== 'none' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-white/40">
                <span className="text-sm">{t('loading')}</span>
              </div>
            ) : (
              <div className="max-w-lg mx-auto pt-2 space-y-6">

                {/* ── Section B: KPI Cards ── */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Active Vehicles */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">
                      {kpis.activeVehicles}
                      <span className="text-white/40 text-lg font-normal"> / {kpis.totalVehicles}</span>
                    </p>
                    <p className="text-xs text-white/50 mt-1">{t('kpiActiveVehicles')}</p>
                  </div>
                  {/* Assigned Drivers */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">
                      {kpis.assignedDrivers}
                      <span className="text-white/40 text-lg font-normal"> / {kpis.totalDrivers}</span>
                    </p>
                    <p className="text-xs text-white/50 mt-1">{t('kpiAssignedDrivers')}</p>
                  </div>
                  {/* Maintenance Cost */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white truncate">
                      {maintenanceStats.totalCost > 0
                        ? formatCurrency(maintenanceStats.totalCost, maintenanceStats.currency)
                        : '—'}
                    </p>
                    <p className="text-xs text-white/50 mt-1">{t('kpiMaintenanceCost')}</p>
                  </div>
                  {/* Doc Compliance */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">
                      {documentStats.compliancePct}
                      <span className="text-white/40 text-lg font-normal">%</span>
                    </p>
                    <p className="text-xs text-white/50 mt-1">{t('kpiDocCompliance')}</p>
                  </div>
                </div>

                {/* ── Section C: Maintenance Status ── */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                  <h2 className="text-sm font-semibold text-white/80">{t('maintenanceOverview')}</h2>

                  {/* Status pills */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {t('statusOk')} ({maintenanceStats.okCount})
                    </span>
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      {t('statusWarning')} ({maintenanceStats.warningCount})
                    </span>
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {t('statusOverdue')} ({maintenanceStats.overdueCount})
                    </span>
                  </div>

                  {/* Cost by type */}
                  {maintenanceStats.costByType.length > 0 ? (
                    <div className="space-y-2">
                      {(() => {
                        const maxCost = Math.max(...maintenanceStats.costByType.map((c) => c.total));
                        return maintenanceStats.costByType.map((item) => (
                          <div key={item.type} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/70">{item.label}</span>
                              <span className="text-white/50 font-mono">
                                {formatCurrency(item.total, maintenanceStats.currency)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500/60 rounded-full"
                                style={{ width: `${maxCost > 0 ? (item.total / maxCost) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-white/30">{t('noAnalyticsData')}</p>
                  )}
                </div>

                {/* ── Section D: Document Compliance ── */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                  <h2 className="text-sm font-semibold text-white/80">{t('docComplianceOverview')}</h2>

                  {/* Big progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">{t('kpiDocCompliance')}</span>
                      <span className="text-white font-semibold">{documentStats.compliancePct}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${documentStats.compliancePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stat chips */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">
                      {documentStats.validCount} {t('docsValid')}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                      {documentStats.expiringSoonCount} {t('docsExpiring')}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-400">
                      {documentStats.expiredCount} {t('docsExpired')}
                    </span>
                  </div>

                  {/* By entity type */}
                  {documentStats.totalDocs > 0 && (
                    <div className="space-y-2">
                      {documentStats.byEntityType.map((e) => {
                        const total = e.valid + e.expiring + e.expired + e.noExpiry;
                        if (total === 0) return null;
                        const validPct = total > 0 ? ((e.valid + e.noExpiry) / total) * 100 : 0;
                        const expiringPct = total > 0 ? (e.expiring / total) * 100 : 0;
                        const expiredPct = total > 0 ? (e.expired / total) * 100 : 0;
                        return (
                          <div key={e.entityType} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/60">{ENTITY_LABELS[e.entityType]}</span>
                              <span className="text-white/40">{total} {t('docsLabel')}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                              <div className="h-full bg-green-500/70" style={{ width: `${validPct}%` }} />
                              <div className="h-full bg-yellow-500/70" style={{ width: `${expiringPct}%` }} />
                              <div className="h-full bg-red-500/70" style={{ width: `${expiredPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Section E: Fleet Composition ── */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                  <h2 className="text-sm font-semibold text-white/80">{t('fleetCompositionLabel')}</h2>

                  {fleetComposition.byCategory.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {(() => {
                          const maxCount = Math.max(...fleetComposition.byCategory.map((c) => c.count));
                          return fleetComposition.byCategory.map((item) => (
                            <div key={item.category} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/70">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                                <span className="text-white/50">{item.count}</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500/60 rounded-full"
                                  style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                      <p className="text-xs text-white/40 pt-1">
                        {t('avgFleetMileage')}: {formatNumber(fleetComposition.avgMileageKm)} km
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-white/30">{t('noAnalyticsData')}</p>
                  )}
                </div>

                {/* ── Section F: Cost Trend — ORO ONLY ── */}
                <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 overflow-hidden">
                  <h2 className="text-sm font-semibold text-white/80">{t('costTrend')}</h2>

                  {/* Content — always rendered so blur works */}
                  <div className={analyticsLevel !== 'advanced' ? 'blur-sm pointer-events-none select-none' : ''}>
                    {maintenanceStats.monthlyTrend.some((m) => m.cost > 0) ? (
                      <div className="flex items-end gap-2 h-28">
                        {(() => {
                          const maxCost = Math.max(...maintenanceStats.monthlyTrend.map((m) => m.cost), 1);
                          return maintenanceStats.monthlyTrend.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px] text-white/40 font-mono">
                                {m.cost > 0 ? formatCurrency(m.cost, maintenanceStats.currency) : ''}
                              </span>
                              <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                                <div
                                  className="w-full rounded-t bg-amber-500/60"
                                  style={{ height: `${Math.max((m.cost / maxCost) * 64, m.cost > 0 ? 4 : 0)}px` }}
                                />
                              </div>
                              <span className="text-[10px] text-white/50">{m.month}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center">
                        <p className="text-xs text-white/30">{t('noAnalyticsData')}</p>
                      </div>
                    )}
                  </div>

                  {/* Oro gate overlay */}
                  {analyticsLevel !== 'advanced' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1.5 rounded-full">
                        ✨ {t('oroOnlyFeature')}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Section G: Mileage by Vehicle — ORO ONLY ── */}
                <div className="relative bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 overflow-hidden">
                  <h2 className="text-sm font-semibold text-white/80">{t('mileageByVehicle')}</h2>

                  {/* Content */}
                  <div className={analyticsLevel !== 'advanced' ? 'blur-sm pointer-events-none select-none' : ''}>
                    {fleetComposition.mileageByVehicle.length > 0 ? (
                      <div className="space-y-2">
                        {(() => {
                          const maxKm = Math.max(...fleetComposition.mileageByVehicle.map((v) => v.mileageKm), 1);
                          return fleetComposition.mileageByVehicle.map((v) => (
                            <div key={v.plate} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono text-white/70 font-bold">{v.plate}</span>
                                <span className="text-white/50">{formatNumber(v.mileageKm)} km</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500/60 rounded-full"
                                  style={{ width: `${maxKm > 0 ? (v.mileageKm / maxKm) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-white/30">{t('noAnalyticsData')}</p>
                    )}
                  </div>

                  {/* Oro gate overlay */}
                  {analyticsLevel !== 'advanced' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1.5 rounded-full">
                        ✨ {t('oroOnlyFeature')}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FleetAnalytics;
