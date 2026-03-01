import React, { useState } from 'react';
import { X, Building2, Truck, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { useCompany } from '../hooks/useCompany';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier } from '../types/subscription';
import type { TransportModality, Company } from '../types/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompanySetupProps {
  userId: string;
  subscriptionTier: SubscriptionTier;
  onClose: () => void;
  onSaved: () => void;
}

const MODALITY_LABELS: Record<TransportModality, string> = {
  taxi: 'Taxi',
  rideshare: 'Rideshare',
  shuttle: 'Shuttle',
  charter: 'Charter',
  rental: 'Renta de vehículos',
  passengers_intercity: 'Pasajeros Intercity',
  school_transport: 'Transporte Escolar',
  tourism: 'Turismo',
  medical_transport: 'Transporte Médico',
  funeral: 'Funerario',
  delivery: 'Delivery / Mensajería',
  logistics: 'Logística',
  cargo_general: 'Carga General',
  cargo_refrigerated: 'Carga Refrigerada',
  cargo_hazmat: 'Carga Peligrosa (Hazmat)',
  cargo_animals: 'Carga Animales',
  cargo_valuables: 'Carga de Valores',
  cargo_finished_goods: 'Productos Terminados',
  cargo_heavy: 'Carga Pesada',
};

const ALL_MODALITIES = Object.keys(MODALITY_LABELS) as TransportModality[];

const CompanySetup: React.FC<CompanySetupProps> = ({
  userId,
  subscriptionTier,
  onClose,
  onSaved,
}) => {
  const { t } = useApp();
  const { company, createCompany, updateCompany } = useCompany(userId);
  const maxModalities = SUBSCRIPTION_PLANS[subscriptionTier].maxModalities;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — basic data
  const [name, setName] = useState(company?.name ?? '');
  const [legalName, setLegalName] = useState(company?.legalName ?? '');
  const [taxId, setTaxId] = useState(company?.taxId ?? '');
  const [description, setDescription] = useState(company?.description ?? '');

  // Step 2 — modalities
  const [modalities, setModalities] = useState<TransportModality[]>(
    company?.modalities ?? [],
  );

  // Step 3 — contact
  const [contactName, setContactName] = useState(company?.contact?.name ?? '');
  const [contactEmail, setContactEmail] = useState(company?.contact?.email ?? '');
  const [contactPhone, setContactPhone] = useState(company?.contact?.phone ?? '');

  const toggleModality = (m: TransportModality) => {
    setModalities((prev) => {
      if (prev.includes(m)) return prev.filter((x) => x !== m);
      if (maxModalities !== -1 && prev.length >= maxModalities) {
        toast.error(t('limitReachedModalities').replace('{max}', String(maxModalities)));
        return prev;
      }
      return [...prev, m];
    });
  };

  const handleFinish = async () => {
    if (!name.trim()) {
      toast.error(t('fieldRequired').replace('{field}', t('companyName')));
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Company> = {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        description: description.trim() || undefined,
        modalities,
        contact: contactName
          ? { name: contactName, email: contactEmail, phone: contactPhone || undefined }
          : undefined,
      };
      if (company) {
        await updateCompany(payload);
        toast.success(t('companyUpdated'));
      } else {
        await createCompany(payload);
        toast.success(t('companyCreated'));
      }
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error(t('errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const stepLabel = t('stepOf')
    .replace('{step}', String(step))
    .replace('{total}', '3');

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
            <Building2 size={24} className="text-amber-400" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                {t('companySetupTitle')}
              </h1>
              <p className="text-white/50 text-xs">{stepLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 pb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  s === step
                    ? 'bg-amber-500 text-white'
                    : s < step
                    ? 'bg-amber-500/40 text-amber-300'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 rounded transition-colors ${
                    s < step ? 'bg-amber-500/50' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-lg mx-auto space-y-4 pt-2">

          {/* Step 1 — Basic data */}
          {step === 1 && (
            <>
              <div className="space-y-1">
                <Label className="text-white/70">{t('companyName')} *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Transportes Acme S.A.S."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">{t('legalName')}</Label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Razón social oficial"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">{t('taxId')}</Label>
                <Input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="900.123.456-7"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">{t('description')}</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descripción breve de tu empresa…"
                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
            </>
          )}

          {/* Step 2 — Modalities */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                <Truck size={16} className="text-amber-400 flex-shrink-0" />
                <p className="text-white/70 text-xs">
                  {t('transportModalities')} ·{' '}
                  {maxModalities === -1
                    ? t('unlimitedModalities')
                    : t('maxN').replace('{max}', String(maxModalities))}{' '}
                  ({t('nSelected').replace('{n}', String(modalities.length))})
                </p>
              </div>
              {maxModalities === 0 ? (
                <div className="text-center py-8 text-white/50 text-sm">
                  {t('enterpriseOnlyBronce')}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODALITIES.map((m) => {
                    const selected = modalities.includes(m);
                    const disabled =
                      !selected &&
                      maxModalities !== -1 &&
                      modalities.length >= maxModalities;
                    return (
                      <button
                        key={m}
                        onClick={() => toggleModality(m)}
                        disabled={disabled}
                        className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          selected
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                            : disabled
                            ? 'bg-white/3 border-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-white/5 border-white/15 text-white/70 hover:border-white/30'
                        }`}
                      >
                        {MODALITY_LABELS[m]}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 3 — Contact */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                <Phone size={16} className="text-amber-400 flex-shrink-0" />
                <p className="text-white/70 text-xs">{t('contactName')}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">{t('contactName')}</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">{t('contactEmail')}</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">{t('contactPhone')}</Label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-white/10">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 ? (
            <Button
              variant="outline"
              className="flex-1 max-w-[160px]"
              onClick={() => setStep((s) => s - 1)}
            >
              {t('previous')}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 max-w-[160px]" onClick={onClose}>
              {t('cancel')}
            </Button>
          )}
          {step < 3 ? (
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  toast.error(t('fieldRequired').replace('{field}', t('companyName')));
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              {t('next')}
            </Button>
          ) : (
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? t('saving') : t('finish')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;
