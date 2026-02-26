import { useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Button } from '../../../components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getMaintenanceStatus } from '../../../features/enterprise/types/maintenance';
import type { MaintenanceStatus } from '../../../features/enterprise/types/maintenance';

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  ok:      'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  warning: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  overdue: 'bg-red-500/15 text-red-600 border-red-500/30',
};

export default function AdminMaintenance() {
  const { t } = useApp();
  const { maintenanceRecords, vehicles, loading, refresh } = useAdminData();

  const vehicleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of vehicles) map[v.id] = v.plate;
    return map;
  }, [vehicles]);

  const rows = useMemo(() => {
    return maintenanceRecords.map((rec) => {
      const currentKm = vehicles.find((v) => v.id === rec.vehicleId)?.currentMileageKm ?? 0;
      // Build a partial record matching the type
      const partialRecord = {
        id: rec.id,
        vehicleId: rec.vehicleId,
        companyId: rec.companyId ?? '',
        type: rec.type as import('../../../features/enterprise/types/maintenance').MaintenanceType,
        date: rec.date ?? new Date(),
        mileageAtService: rec.mileageAtService ?? 0,
        nextServiceKm: rec.nextServiceKm,
        nextServiceDate: rec.nextServiceDate,
        createdAt: rec.date ?? new Date(),
      };
      const { status, daysRemaining, kmRemaining } = getMaintenanceStatus(partialRecord, currentKm);
      return { ...rec, status, daysRemaining, kmRemaining, plate: vehicleMap[rec.vehicleId] ?? rec.vehicleId };
    }).sort((a, b) => {
      const order: Record<MaintenanceStatus, number> = { overdue: 0, warning: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });
  }, [maintenanceRecords, vehicles, vehicleMap]);

  const overdue = rows.filter((r) => r.status === 'overdue').length;
  const warning = rows.filter((r) => r.status === 'warning').length;
  const ok = rows.filter((r) => r.status === 'ok').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('adminMaintenance')}</h1>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('adminRefresh')}
        </Button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border font-medium ${STATUS_STYLES.overdue}`}>
          {t('statusOverdue')}: {overdue}
        </span>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border font-medium ${STATUS_STYLES.warning}`}>
          {t('statusWarning')}: {warning}
        </span>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border font-medium ${STATUS_STYLES.ok}`}>
          {t('statusOk')}: {ok}
        </span>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">{t('plate')}</th>
              <th className="text-left px-3 py-2 font-medium">{t('maintenanceType')}</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">{t('maintenanceDate')}</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-mono font-semibold">{r.plate}</td>
                <td className="px-3 py-2 capitalize">{r.type.replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                  {r.date ? r.date.toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_STYLES[r.status]}`}>
                    {t(`status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden md:table-cell text-xs">
                  {r.daysRemaining != null
                    ? (r.daysRemaining < 0
                      ? t('daysOverdue').replace('{n}', String(Math.abs(r.daysRemaining)))
                      : t('daysRemaining').replace('{n}', String(r.daysRemaining)))
                    : r.kmRemaining != null
                      ? (r.kmRemaining < 0
                        ? t('kmOverdue').replace('{n}', String(Math.abs(r.kmRemaining)))
                        : t('kmRemaining').replace('{n}', String(r.kmRemaining)))
                      : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
