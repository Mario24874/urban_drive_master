import React, { useState } from 'react';
import { X, Plus, Wrench, Pencil, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { useMaintenanceByVehicle } from '../hooks/useMaintenance';
import { getMaintenanceStatus } from '../types/maintenance';
import type { MaintenanceRecord, MaintenanceType } from '../types/maintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface MaintenanceLogProps {
  vehicleId: string;
  vehiclePlate: string;
  vehicleMileageKm: number;
  companyId: string;
  onClose: () => void;
}

const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  oil_change: '🛢️ Cambio de aceite',
  brakes: '🔴 Frenos',
  tires: '🔵 Llantas / Neumáticos',
  timing_belt: '⚙️ Correa de distribución',
  filters: '🌬️ Filtros',
  battery: '🔋 Batería',
  suspension: '🔩 Suspensión',
  transmission: '⚙️ Transmisión / Caja',
  alignment: '↔️ Alineación y balanceo',
  ac_service: '❄️ Sistema A/C',
  lights: '💡 Luces y electricidad',
  general_inspection: '🔍 Revisión general',
};

const ALL_TYPES = Object.keys(MAINTENANCE_LABELS) as MaintenanceType[];

const STATUS_COLORS = {
  ok: 'text-green-400 bg-green-400/10 border-green-400/30',
  warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  overdue: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const STATUS_ICONS = {
  ok: <CheckCircle size={14} />,
  warning: <Clock size={14} />,
  overdue: <AlertTriangle size={14} />,
};

type FormData = {
  type: MaintenanceType;
  date: string;
  mileageAtService: string;
  nextServiceKm: string;
  nextServiceDate: string;
  workshopName: string;
  technician: string;
  cost: string;
  notes: string;
};

const DEFAULT_FORM: FormData = {
  type: 'oil_change',
  date: new Date().toISOString().split('T')[0],
  mileageAtService: '',
  nextServiceKm: '',
  nextServiceDate: '',
  workshopName: '',
  technician: '',
  cost: '',
  notes: '',
};

const MaintenanceLog: React.FC<MaintenanceLogProps> = ({
  vehicleId,
  vehiclePlate,
  vehicleMileageKm,
  companyId,
  onClose,
}) => {
  const { t } = useApp();
  const { records, addRecord, updateRecord, deleteRecord } = useMaintenanceByVehicle(vehicleId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const field = (key: keyof FormData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM, mileageAtService: String(vehicleMileageKm) });
    setSheetOpen(true);
  };

  const openEdit = (r: MaintenanceRecord) => {
    setEditingId(r.id);
    setForm({
      type: r.type,
      date: r.date.toISOString().split('T')[0],
      mileageAtService: String(r.mileageAtService),
      nextServiceKm: r.nextServiceKm !== undefined ? String(r.nextServiceKm) : '',
      nextServiceDate: r.nextServiceDate
        ? r.nextServiceDate.toISOString().split('T')[0]
        : '',
      workshopName: r.workshopName ?? '',
      technician: r.technician ?? '',
      cost: r.cost !== undefined ? String(r.cost) : '',
      notes: r.notes ?? '',
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.date) {
      toast.error(t('maintenanceDate') + ' es requerida');
      return;
    }
    setSaving(true);
    try {
      const payload: Omit<MaintenanceRecord, 'id' | 'createdAt'> = {
        vehicleId,
        companyId,
        type: form.type,
        date: new Date(form.date + 'T12:00:00'),
        mileageAtService: parseInt(form.mileageAtService) || 0,
        nextServiceKm: form.nextServiceKm ? parseInt(form.nextServiceKm) : undefined,
        nextServiceDate: form.nextServiceDate
          ? new Date(form.nextServiceDate + 'T12:00:00')
          : undefined,
        workshopName: form.workshopName.trim() || undefined,
        technician: form.technician.trim() || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editingId) {
        await updateRecord(editingId, payload);
        toast.success(t('maintenanceUpdated'));
      } else {
        await addRecord(payload);
        toast.success(t('maintenanceAdded'));
      }
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
      toast.success(t('maintenanceRemoved'));
      setConfirmDeleteId(null);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/background.jpg)' }}
        />
        <div className="absolute inset-0 -z-10 bg-black/80" />

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Wrench size={22} className="text-amber-400" />
              <div>
                <h1 className="font-display text-white font-bold text-lg leading-tight">
                  {t('maintenanceLog')}
                </h1>
                <p className="text-white/50 text-xs font-mono">{vehiclePlate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAdd}
                className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
              <Wrench size={48} />
              <p className="text-sm">{t('maintenanceEmpty')}</p>
              <Button
                onClick={openAdd}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Plus size={16} className="mr-2" />
                {t('addMaintenance')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-w-lg mx-auto pt-2">
              {records.map((r) => {
                const { status, daysRemaining, kmRemaining } = getMaintenanceStatus(
                  r,
                  vehicleMileageKm,
                );
                return (
                  <div
                    key={r.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white text-sm font-semibold">
                            {MAINTENANCE_LABELS[r.type] ?? r.type}
                          </span>
                          {(r.nextServiceDate || r.nextServiceKm !== undefined) && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}
                            >
                              {STATUS_ICONS[status]}
                              {status === 'ok'
                                ? t('statusOk')
                                : status === 'warning'
                                ? t('statusWarning')
                                : t('statusOverdue')}
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-xs">
                          {r.date.toLocaleDateString()} · {r.mileageAtService.toLocaleString()} km
                          {r.workshopName ? ` · ${r.workshopName}` : ''}
                          {r.cost !== undefined ? ` · $${r.cost.toLocaleString()}` : ''}
                        </p>
                        {/* Next service info */}
                        {(r.nextServiceDate || r.nextServiceKm !== undefined) && (
                          <p className={`text-xs mt-1 ${
                            status === 'overdue'
                              ? 'text-red-400'
                              : status === 'warning'
                              ? 'text-yellow-400'
                              : 'text-green-400/70'
                          }`}>
                            {r.nextServiceKm !== undefined && kmRemaining !== undefined && (
                              <span>
                                {kmRemaining >= 0
                                  ? t('kmRemaining').replace('{n}', String(kmRemaining.toLocaleString()))
                                  : t('kmOverdue').replace('{n}', String(Math.abs(kmRemaining).toLocaleString()))}
                                {r.nextServiceDate ? ' · ' : ''}
                              </span>
                            )}
                            {r.nextServiceDate && daysRemaining !== undefined && (
                              <span>
                                {daysRemaining >= 0
                                  ? t('daysRemaining').replace('{n}', String(daysRemaining))
                                  : t('daysOverdue').replace('{n}', String(Math.abs(daysRemaining)))}
                              </span>
                            )}
                          </p>
                        )}
                        {r.notes && (
                          <p className="text-white/30 text-xs mt-1 italic truncate">{r.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(r)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? t('editMaintenance') : t('addMaintenance')}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            {/* Type */}
            <div className="space-y-1">
              <Label>{t('maintenanceType')} *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {ALL_TYPES.map((mt) => (
                  <button
                    key={mt}
                    onClick={() => field('type', mt)}
                    className={`text-left py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      form.type === mt
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {MAINTENANCE_LABELS[mt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('maintenanceDate')} *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => field('date', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('mileageAtService')} (km)</Label>
                <Input
                  type="number"
                  value={form.mileageAtService}
                  onChange={(e) => field('mileageAtService', e.target.value)}
                  placeholder={String(vehicleMileageKm)}
                  min={0}
                />
              </div>
            </div>

            {/* Next service */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('nextServiceKm')}</Label>
                <Input
                  type="number"
                  value={form.nextServiceKm}
                  onChange={(e) => field('nextServiceKm', e.target.value)}
                  placeholder="ej. 55000"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('nextServiceDate')}</Label>
                <Input
                  type="date"
                  value={form.nextServiceDate}
                  onChange={(e) => field('nextServiceDate', e.target.value)}
                />
              </div>
            </div>

            {/* Workshop + Technician */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('workshopName')}</Label>
                <Input
                  value={form.workshopName}
                  onChange={(e) => field('workshopName', e.target.value)}
                  placeholder="Taller Pérez"
                />
              </div>
              <div className="space-y-1">
                <Label>{t('cost')}</Label>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={(e) => field('cost', e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>{t('maintenanceNotes')}</Label>
              <textarea
                value={form.notes}
                onChange={(e) => field('notes', e.target.value)}
                rows={2}
                placeholder="Observaciones opcionales…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2 pb-4">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                {t('cancel')}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : t('saveChanges')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold">{t('maintenanceRemoved')}</h3>
            <p className="text-sm text-muted-foreground">{t('confirmDelete')}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleDelete(confirmDeleteId)}>
                {t('remove')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenanceLog;
