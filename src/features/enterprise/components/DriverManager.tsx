import React, { useState } from 'react';
import { X, Plus, Lock, Users, Pencil, Trash2, Car, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { useDrivers } from '../hooks/useDrivers';
import { useFleet } from '../hooks/useFleet';
import DocumentVault from './DocumentVault';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier } from '../types/subscription';
import type { CompanyDriver } from '../types/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface DriverManagerProps {
  companyId: string;
  subscriptionTier: SubscriptionTier;
  onClose: () => void;
}

type FormData = {
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseCategory: string;
  assignedVehicleId: string;
};

const DEFAULT_FORM: FormData = {
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseCategory: '',
  assignedVehicleId: '',
};

const LICENSE_CATEGORIES = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'C4'];

const DriverManager: React.FC<DriverManagerProps> = ({
  companyId,
  subscriptionTier,
  onClose,
}) => {
  const { t } = useApp();
  const { drivers, addDriver, updateDriver, removeDriver, assignVehicle } = useDrivers(companyId);
  const { vehicles } = useFleet(companyId);
  const maxDrivers = SUBSCRIPTION_PLANS[subscriptionTier].maxDrivers;
  const isAtLimit = maxDrivers !== -1 && drivers.length >= maxDrivers;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [documentDriver, setDocumentDriver] = useState<{
    id: string; name: string;
  } | null>(null);

  const openAdd = () => {
    if (isAtLimit) {
      toast.error(`Límite de ${maxDrivers} conductores alcanzado. Actualiza tu plan.`);
      return;
    }
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setSheetOpen(true);
  };

  const openEdit = (d: CompanyDriver) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      phone: d.phone ?? '',
      email: d.email ?? '',
      licenseNumber: d.licenseNumber ?? '',
      licenseCategory: d.licenseCategory ?? '',
      assignedVehicleId: d.assignedVehicleId ?? '',
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t('displayName') + ' es requerido');
      return;
    }
    setSaving(true);
    try {
      const payload: Omit<CompanyDriver, 'id' | 'companyId' | 'createdAt'> = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        licenseCategory: form.licenseCategory || undefined,
        assignedVehicleId: form.assignedVehicleId || undefined,
        isActive: true,
      };

      if (editingId) {
        await updateDriver(editingId, payload);
        // Handle vehicle assignment change
        const prevDriver = drivers.find((d) => d.id === editingId);
        const newVehicleId = form.assignedVehicleId || null;
        if (prevDriver?.assignedVehicleId !== (newVehicleId ?? undefined)) {
          await assignVehicle(editingId, newVehicleId);
        }
        toast.success('Conductor actualizado');
      } else {
        await addDriver(payload);
        toast.success(t('driverAdded'));
      }
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el conductor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeDriver(id);
      toast.success(t('driverRemoved'));
      setConfirmDeleteId(null);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Available vehicles: active + unassigned OR currently assigned to this driver
  const availableVehicles = vehicles.filter(
    (v) => v.isActive && (!v.driverId || v.driverId === editingId),
  );

  const getVehiclePlate = (vehicleId?: string) =>
    vehicles.find((v) => v.id === vehicleId)?.plate ?? null;

  const field = (key: keyof FormData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <>
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
              <Users size={22} className="text-amber-400" />
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">
                  Conductores
                </h1>
                <p className="text-white/50 text-xs">
                  {drivers.length}
                  {maxDrivers !== -1 ? ` / ${maxDrivers}` : ''} conductores
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAdd}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isAtLimit
                    ? 'bg-white/5 text-white/30 cursor-default'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title={isAtLimit ? 'Límite alcanzado' : t('addDriver')}
              >
                {isAtLimit ? <Lock size={16} /> : <Plus size={18} />}
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
          {drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
              <Users size={48} />
              <p className="text-sm">{t('driversEmpty')}</p>
              <Button
                onClick={openAdd}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isAtLimit}
              >
                <Plus size={16} className="mr-2" />
                {t('addDriver')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-w-lg mx-auto pt-2">
              {drivers.map((d) => {
                const plate = getVehiclePlate(d.assignedVehicleId);
                return (
                  <div
                    key={d.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm truncate">
                          {d.name}
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            d.isActive ? 'bg-green-400' : 'bg-white/20'
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {d.phone && (
                          <span className="text-white/50 text-xs">{d.phone}</span>
                        )}
                        {plate ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500/40 text-amber-400 flex items-center gap-1"
                          >
                            <Car size={9} />
                            {plate}
                          </Badge>
                        ) : (
                          <span className="text-white/30 text-xs">
                            {t('noVehicleAssigned')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDocumentDriver({ id: d.id, name: d.name })}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 flex items-center justify-center text-white/50 hover:text-blue-400 transition-colors"
                        title="Documentos"
                      >
                        <FileText size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(d)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(d.id)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
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
              {editingId ? t('editDriver') : t('addDriver')}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label>{t('displayName')} *</Label>
              <Input
                value={form.name}
                onChange={(e) => field('name', e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('phoneOptional')}</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => field('phone', e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => field('email', e.target.value)}
                  placeholder="driver@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('licenseNumber')}</Label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => field('licenseNumber', e.target.value)}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-1">
                <Label>{t('licenseCategory')}</Label>
                <div className="flex flex-wrap gap-1">
                  {LICENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        field('licenseCategory', form.licenseCategory === cat ? '' : cat)
                      }
                      className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                        form.licenseCategory === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('assignedVehicle')}</Label>
              {availableVehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Sin vehículos disponibles para asignar
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => field('assignedVehicleId', '')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      !form.assignedVehicleId
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {t('noVehicleAssigned')}
                  </button>
                  {availableVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => field('assignedVehicleId', v.id)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        form.assignedVehicleId === v.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/30'
                      }`}
                    >
                      {v.plate} · {v.make}
                    </button>
                  ))}
                </div>
              )}
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

      {/* DocumentVault sub-overlay */}
      {documentDriver && (
        <DocumentVault
          entityId={documentDriver.id}
          entityType="driver"
          entityName={documentDriver.name}
          companyId={companyId}
          onClose={() => setDocumentDriver(null)}
          zIndex="z-[60]"
        />
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold">{t('deleteDriver')}</h3>
            <p className="text-sm text-muted-foreground">{t('confirmDelete')}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDeleteId(null)}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDelete(confirmDeleteId)}
              >
                {t('remove')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriverManager;
