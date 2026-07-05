import React, { useState } from 'react';
import { X, FileText, Plus, Pencil, Trash2, CheckCircle, Clock, AlertTriangle, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { useDocumentsByEntity } from '../hooks/useDocuments';
import {
  COMPANY_DOC_TYPES,
  VEHICLE_DOC_TYPES,
  DRIVER_DOC_TYPES,
  DOC_TYPE_LABELS,
  getDocumentStatus,
} from '../types/documents';
import type { DocumentEntityType, AnyDocType, DocumentRecord, DocumentStatus } from '../types/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface DocumentVaultProps {
  entityId: string;
  entityType: DocumentEntityType;
  entityName: string;   // plate, driver name, or company name
  companyId: string;
  onClose: () => void;
  zIndex?: string;      // e.g. 'z-[60]' when opened inside another overlay
}

const ENTITY_DOC_TYPES: Record<DocumentEntityType, AnyDocType[]> = {
  company: COMPANY_DOC_TYPES,
  vehicle: VEHICLE_DOC_TYPES,
  driver: DRIVER_DOC_TYPES,
};

const STATUS_STYLES: Record<DocumentStatus, string> = {
  valid: 'text-green-400 bg-green-400/10 border-green-400/30',
  expiring_soon: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  expired: 'text-red-400 bg-red-400/10 border-red-400/30',
  no_expiry: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/30',
};

const STATUS_ICONS: Record<DocumentStatus, React.ReactNode> = {
  valid: <CheckCircle size={13} />,
  expiring_soon: <Clock size={13} />,
  expired: <AlertTriangle size={13} />,
  no_expiry: <CheckCircle size={13} />,
};

type FormData = {
  docType: AnyDocType;
  issueDate: string;
  expiryDate: string;
  fileURL: string;
  notes: string;
};

const DEFAULT_FORM = (docType: AnyDocType): FormData => ({
  docType,
  issueDate: '',
  expiryDate: '',
  fileURL: '',
  notes: '',
});

const DocumentVault: React.FC<DocumentVaultProps> = ({
  entityId,
  entityType,
  entityName,
  companyId,
  onClose,
  zIndex = 'z-[60]',
}) => {
  const { t } = useApp();
  const { documents, addDocument, updateDocument, deleteDocument } = useDocumentsByEntity(entityId);
  const expectedTypes = ENTITY_DOC_TYPES[entityType];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM(expectedTypes[0]));
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const docMap = new Map<AnyDocType, DocumentRecord>(
    documents.map((d) => [d.docType, d]),
  );

  const field = (key: keyof FormData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = (docType: AnyDocType) => {
    setEditingId(null);
    setForm(DEFAULT_FORM(docType));
    setSheetOpen(true);
  };

  const openEdit = (doc: DocumentRecord) => {
    setEditingId(doc.id);
    setForm({
      docType: doc.docType,
      issueDate: doc.issueDate ? doc.issueDate.toISOString().split('T')[0] : '',
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : '',
      fileURL: doc.fileURL ?? '',
      notes: doc.notes ?? '',
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Omit<DocumentRecord, 'id' | 'createdAt'> = {
        entityId,
        entityType,
        companyId,
        docType: form.docType,
        name: DOC_TYPE_LABELS[form.docType],
        issueDate: form.issueDate ? new Date(form.issueDate + 'T12:00:00') : undefined,
        expiryDate: form.expiryDate ? new Date(form.expiryDate + 'T12:00:00') : undefined,
        fileURL: form.fileURL.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isVerified: false,
      };

      if (editingId) {
        await updateDocument(editingId, payload);
        toast.success(t('documentUpdated'));
      } else {
        await addDocument(payload);
        toast.success(t('documentAdded'));
      }
      setSheetOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el documento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success(t('documentRemoved'));
      setConfirmDeleteId(null);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const validCount = expectedTypes.filter((t) => docMap.has(t)).length;

  return (
    <>
      <div className={`fixed inset-0 ${zIndex} flex flex-col overflow-hidden`}>
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/background.jpg)' }}
        />
        <div className="absolute inset-0 -z-10 bg-black/80" />

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-brand-yellow" />
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">
                  {t('documentVault')}
                </h1>
                <p className="text-white/50 text-xs font-mono">
                  {entityName} · {validCount}/{expectedTypes.length} docs
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

        {/* Checklist */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="max-w-lg mx-auto pt-2 space-y-3">
            {expectedTypes.map((docType) => {
              const existing = docMap.get(docType);
              if (existing) {
                const { status, daysRemaining } = getDocumentStatus(existing);
                return (
                  <div
                    key={docType}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white text-sm font-medium">
                          {DOC_TYPE_LABELS[docType]}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}
                        >
                          {STATUS_ICONS[status]}
                          {status === 'valid'
                            ? t('docStatusValid')
                            : status === 'expiring_soon'
                            ? t('docStatusExpiring')
                            : status === 'expired'
                            ? t('docStatusExpired')
                            : t('docStatusNoExpiry')}
                        </span>
                      </div>
                      <p className="text-white/50 text-xs">
                        {existing.issueDate
                          ? `${t('docIssueDate')}: ${existing.issueDate.toLocaleDateString()}`
                          : ''}
                        {existing.issueDate && existing.expiryDate ? ' · ' : ''}
                        {existing.expiryDate
                          ? `${t('docExpiryDate')}: ${existing.expiryDate.toLocaleDateString()}`
                          : ''}
                      </p>
                      {daysRemaining !== undefined && (
                        <p
                          className={`text-xs mt-0.5 ${
                            status === 'expired'
                              ? 'text-red-400'
                              : status === 'expiring_soon'
                              ? 'text-yellow-400'
                              : 'text-green-400/70'
                          }`}
                        >
                          {daysRemaining >= 0
                            ? t('daysRemaining').replace('{n}', String(daysRemaining))
                            : t('daysOverdue').replace('{n}', String(Math.abs(daysRemaining)))}
                        </p>
                      )}
                      {existing.fileURL && (
                        <a
                          href={existing.fileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-yellow hover:text-brand-amber mt-1"
                        >
                          <Link size={10} /> {t('viewDocument')}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(existing)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(existing.id)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              // Missing document row
              return (
                <div
                  key={docType}
                  className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white/20 flex-shrink-0" />
                    <span className="text-white/40 text-sm">{DOC_TYPE_LABELS[docType]}</span>
                    <span className="text-[10px] text-white/25 border border-white/15 rounded-full px-2 py-0.5">
                      {t('docMissing')}
                    </span>
                  </div>
                  <button
                    onClick={() => openAdd(docType)}
                    className="flex items-center gap-1 text-xs text-brand-yellow hover:text-brand-amber transition-colors flex-shrink-0"
                  >
                    <Plus size={13} />
                    {t('addDocument')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {DOC_TYPE_LABELS[form.docType]}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('docIssueDate')}</Label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => field('issueDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('docExpiryDate')}</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => field('expiryDate', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('docFileURL')}</Label>
              <Input
                type="url"
                value={form.fileURL}
                onChange={(e) => field('fileURL', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </div>
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
        <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60`}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold">{t('deleteDocument')}</h3>
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

export default DocumentVault;
