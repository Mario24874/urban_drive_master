import React, { useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useMaintenanceByCompany } from '../hooks/useMaintenance';
import { useFleet } from '../hooks/useFleet';
import { getMaintenanceStatus } from '../types/maintenance';
import type { MaintenanceStatus, MaintenanceAlert } from '../types/maintenance';

interface MaintenanceSchedulerProps {
  companyId: string;
  onClose: () => void;
}

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  ok: 'text-green-400 bg-green-400/10 border-green-400/30',
  warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  overdue: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const STATUS_ICONS: Record<MaintenanceStatus, React.ReactNode> = {
  ok: <CheckCircle size={16} />,
  warning: <Clock size={16} />,
  overdue: <AlertTriangle size={16} />,
};

const MAINTENANCE_SHORT: Record<string, string> = {
  oil_change: 'Aceite',
  brakes: 'Frenos',
  tires: 'Llantas',
  timing_belt: 'Correa dist.',
  filters: 'Filtros',
  battery: 'Batería',
  suspension: 'Suspensión',
  transmission: 'Transmisión',
  alignment: 'Alineación',
  ac_service: 'A/C',
  lights: 'Luces',
  general_inspection: 'Rev. general',
};

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({
  companyId,
  onClose,
}) => {
  const { t } = useApp();
  const { records, loading: loadingRecords } = useMaintenanceByCompany(companyId);
  const { vehicles, loading: loadingVehicles } = useFleet(companyId);

  const loading = loadingRecords || loadingVehicles;

  // Build alerts: for each vehicle, pick the latest record per maintenance type
  // then evaluate status
  const alerts = useMemo<MaintenanceAlert[]>(() => {
    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    // Group latest record per (vehicleId, type)
    const latestMap = new Map<string, typeof records[0]>();
    for (const r of records) {
      const key = `${r.vehicleId}::${r.type}`;
      const existing = latestMap.get(key);
      if (!existing || r.date > existing.date) {
        latestMap.set(key, r);
      }
    }

    const result: MaintenanceAlert[] = [];
    for (const [, record] of latestMap) {
      // Only show records that have a scheduled next service
      if (!record.nextServiceDate && record.nextServiceKm === undefined) continue;

      const vehicle = vehicleMap.get(record.vehicleId);
      if (!vehicle) continue;

      const { status, daysRemaining, kmRemaining } = getMaintenanceStatus(
        record,
        vehicle.mileageKm ?? 0,
      );

      result.push({
        record,
        vehiclePlate: vehicle.plate,
        status,
        daysRemaining,
        kmRemaining,
      });
    }

    // Sort: overdue first, then warning, then ok; within same status by date
    const ORDER: Record<MaintenanceStatus, number> = { overdue: 0, warning: 1, ok: 2 };
    return result.sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  }, [records, vehicles]);

  const overdue = alerts.filter((a) => a.status === 'overdue');
  const warning = alerts.filter((a) => a.status === 'warning');
  const ok = alerts.filter((a) => a.status === 'ok');

  const renderAlert = (alert: MaintenanceAlert) => {
    const { record, vehiclePlate, status, daysRemaining, kmRemaining } = alert;
    return (
      <div
        key={`${record.vehicleId}::${record.type}`}
        className={`flex items-center gap-3 p-3 rounded-xl border ${STATUS_COLORS[status]}`}
      >
        <div className="flex-shrink-0">{STATUS_ICONS[status]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold">{vehiclePlate}</span>
            <span className="text-xs opacity-80">
              {MAINTENANCE_SHORT[record.type] ?? record.type}
            </span>
          </div>
          <p className="text-xs opacity-70 mt-0.5">
            {record.nextServiceKm !== undefined && kmRemaining !== undefined && (
              <span>
                {kmRemaining >= 0
                  ? t('kmRemaining').replace('{n}', kmRemaining.toLocaleString())
                  : t('kmOverdue').replace('{n}', Math.abs(kmRemaining).toLocaleString())}
                {record.nextServiceDate ? ' · ' : ''}
              </span>
            )}
            {record.nextServiceDate && daysRemaining !== undefined && (
              <span>
                {daysRemaining >= 0
                  ? t('daysRemaining').replace('{n}', String(daysRemaining))
                  : t('daysOverdue').replace('{n}', String(Math.abs(daysRemaining)))}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/background.jpg)' }}
      />
      <div className="absolute inset-0 -z-10 bg-black/75" />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Wrench size={22} className="text-amber-400" />
            <div>
              <h1 className="font-display text-white font-bold text-lg leading-tight">
                {t('maintenanceScheduler')}
              </h1>
              <p className="text-white/50 text-xs">
                {overdue.length > 0 && (
                  <span className="text-red-400">{t('statusOverdue')} ({overdue.length})</span>
                )}
                {overdue.length > 0 && warning.length > 0 && ' · '}
                {warning.length > 0 && (
                  <span className="text-yellow-400">{t('statusWarning')} ({warning.length})</span>
                )}
                {overdue.length === 0 && warning.length === 0 && (
                  <span className="text-green-400">{t('allUpToDate')}</span>
                )}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/40">
            <span className="text-sm">{t('loading')}</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3 text-center">
            <CheckCircle size={48} className="text-green-400/50" />
            <p className="text-sm">{t('allUpToDate')}</p>
            <p className="text-xs text-white/30">
              {t('maintenanceHint')}
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto pt-2 space-y-5">
            {overdue.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {t('statusOverdue')} ({overdue.length})
                </p>
                {overdue.map(renderAlert)}
              </div>
            )}
            {warning.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} />
                  {t('statusWarning')} ({warning.length})
                </p>
                {warning.map(renderAlert)}
              </div>
            )}
            {ok.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle size={12} />
                  {t('statusOk')} ({ok.length})
                </p>
                {ok.map(renderAlert)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceScheduler;
