import React, { useState } from 'react';
import { X, Plus, Lock, Car, Pencil, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { useFleet } from '../hooks/useFleet';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier } from '../types/subscription';
import type { Vehicle, VehicleCategory, FuelType } from '../types/vehicle';
import MaintenanceLog from './MaintenanceLog';
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

interface FleetManagerProps {
  companyId: string;
  subscriptionTier: SubscriptionTier;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  van: 'Van',
  truck: 'Camión',
  motorcycle: 'Moto',
  bicycle: 'Bicicleta',
  bus: 'Bus',
  minibus: 'Minibús',
  other: 'Otro',
};

const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: 'Gasolina',
  diesel: 'Diésel',
  electric: 'Eléctrico',
  hybrid: 'Híbrido',
  lpg: 'GLP',
  cng: 'GNC',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as VehicleCategory[];
const FUELS = Object.keys(FUEL_LABELS) as FuelType[];

type FormData = {
  plate: string;
  make: string;
  model: string;
  year: string;
  color: string;
  category: VehicleCategory;
  fuelType: FuelType;
  passengerCapacity: string;
};

const DEFAULT_FORM: FormData = {
  plate: '',
  make: '',
  model: '',
  year: String(new Date().getFullYear()),
  color: '',
  category: 'sedan',
  fuelType: 'gasoline',
  passengerCapacity: '4',
};

const FleetManager: React.FC<FleetManagerProps> = ({
  companyId,
  subscriptionTier,
  onClose,
}) => {
  const { t } = useApp();
  const { vehicles, addVehicle, updateVehicle, removeVehicle } = useFleet(companyId);
  const maxVehicles = SUBSCRIPTION_PLANS[subscriptionTier].maxVehicles;
  const isAtLimit = maxVehicles !== -1 && vehicles.length >= maxVehicles;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<{
    id: string; plate: string; mileageKm: number;
  } | null>(null);

  const openAdd = () => {
    if (isAtLimit) {
      toast.error(`Límite de ${maxVehicles} vehículos alcanzado. Actualiza tu plan.`);
      return;
    }
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setSheetOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: String(v.year),
      color: v.color ?? '',
      category: v.category,
      fuelType: v.fuelType,
      passengerCapacity: String(v.passengerCapacity),
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.plate.trim()) {
      toast.error(t('plate') + ' es requerida');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        plate: form.plate.trim().toUpperCase(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: parseInt(form.year) || new Date().getFullYear(),
        color: form.color.trim(),
        category: form.category,
        fuelType: form.fuelType,
        passengerCapacity: parseInt(form.passengerCapacity) || 4,
        isActive: true,
        mileageKm: 0,
        transmission: 'manual' as const,
        specializations: {
          accessible: false,
          refrigerated: false,
          heavyCargo: false,
          petFriendly: false,
          luxuryClass: false,
          hazmatCertified: false,
          armoredVehicle: false,
          medicalEquipped: false,
        },
      };
      if (editingId) {
        await updateVehicle(editingId, payload);
        toast.success(t('vehicleUpdated'));
      } else {
        await addVehicle(payload);
        toast.success(t('vehicleAdded'));
      }
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el vehículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeVehicle(id);
      toast.success(t('vehicleRemoved'));
      setConfirmDeleteId(null);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleActive = async (v: Vehicle) => {
    await updateVehicle(v.id, { isActive: !v.isActive });
  };

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
              <Car size={22} className="text-amber-400" />
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">
                  Mi Flota
                </h1>
                <p className="text-white/50 text-xs">
                  {vehicles.length}
                  {maxVehicles !== -1 ? ` / ${maxVehicles}` : ''} vehículos
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
                title={isAtLimit ? 'Límite alcanzado' : t('addVehicle')}
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
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
              <Car size={48} />
              <p className="text-sm">{t('fleetEmpty')}</p>
              <Button
                onClick={openAdd}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isAtLimit}
              >
                <Plus size={16} className="mr-2" />
                {t('addVehicle')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-w-lg mx-auto pt-2">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-white text-sm">
                        {v.plate}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-white/20 text-white/60"
                      >
                        {CATEGORY_LABELS[v.category] ?? v.category}
                      </Badge>
                      <span
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          v.isActive ? 'bg-green-400' : 'bg-white/20'
                        }`}
                      />
                    </div>
                    <p className="text-white/60 text-xs truncate">
                      {[v.make, v.model, v.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(v)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                      title={v.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <span className="text-xs">{v.isActive ? '●' : '○'}</span>
                    </button>
                    <button
                      onClick={() =>
                        setMaintenanceVehicle({ id: v.id, plate: v.plate, mileageKm: v.mileageKm ?? 0 })
                      }
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/20 flex items-center justify-center text-white/50 hover:text-amber-400 transition-colors"
                      title="Mantenimiento"
                    >
                      <Wrench size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(v)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(v.id)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? t('editVehicle') : t('addVehicle')}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label>{t('plate')} *</Label>
              <Input
                value={form.plate}
                onChange={(e) => field('plate', e.target.value)}
                placeholder="ABC-123"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('make')}</Label>
                <Input
                  value={form.make}
                  onChange={(e) => field('make', e.target.value)}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-1">
                <Label>{t('model')}</Label>
                <Input
                  value={form.model}
                  onChange={(e) => field('model', e.target.value)}
                  placeholder="Corolla"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('vehicleYear')}</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => field('year', e.target.value)}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('passengerCapacity')}</Label>
                <Input
                  type="number"
                  value={form.passengerCapacity}
                  onChange={(e) => field('passengerCapacity', e.target.value)}
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('vehicleCategory')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => field('category', c)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      form.category === c
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('vehicleFuelType')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {FUELS.map((f) => (
                  <button
                    key={f}
                    onClick={() => field('fuelType', f)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      form.fuelType === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {FUEL_LABELS[f]}
                  </button>
                ))}
              </div>
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

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold">{t('deleteVehicle')}</h3>
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

      {/* Maintenance Log sub-overlay */}
      {maintenanceVehicle && (
        <MaintenanceLog
          vehicleId={maintenanceVehicle.id}
          vehiclePlate={maintenanceVehicle.plate}
          vehicleMileageKm={maintenanceVehicle.mileageKm}
          companyId={companyId}
          onClose={() => setMaintenanceVehicle(null)}
        />
      )}
    </>
  );
};

export default FleetManager;
