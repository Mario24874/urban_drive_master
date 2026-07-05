import React, { useMemo, useState } from 'react';
import { X, FileText, AlertTriangle, Clock, CheckCircle, Building2, Car, Users } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { useDocumentsByCompany } from '../hooks/useDocuments';
import { useFleet } from '../hooks/useFleet';
import { useDrivers } from '../hooks/useDrivers';
import { useCompany } from '../hooks/useCompany';
import { getDocumentStatus, DOC_TYPE_LABELS } from '../types/documents';
import type { DocumentStatus, DocumentRecord, DocumentEntityType } from '../types/documents';
import DocumentVault from './DocumentVault';

interface DocumentsDashboardProps {
  companyId: string;
  userId: string;
  onClose: () => void;
}

interface DocAlert {
  doc: DocumentRecord;
  entityName: string;
  status: DocumentStatus;
  daysRemaining?: number;
}

const STATUS_STYLES: Record<DocumentStatus, string> = {
  valid: 'text-green-400 bg-green-400/10 border-green-400/30',
  expiring_soon: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  expired: 'text-red-400 bg-red-400/10 border-red-400/30',
  no_expiry: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/30',
};

const STATUS_ICONS: Record<DocumentStatus, React.ReactNode> = {
  valid: <CheckCircle size={14} />,
  expiring_soon: <Clock size={14} />,
  expired: <AlertTriangle size={14} />,
  no_expiry: <CheckCircle size={14} />,
};

const ENTITY_ICONS: Record<DocumentEntityType, React.ReactNode> = {
  company: <Building2 size={14} />,
  vehicle: <Car size={14} />,
  driver: <Users size={14} />,
};

const DocumentsDashboard: React.FC<DocumentsDashboardProps> = ({
  companyId,
  userId,
  onClose,
}) => {
  const { t } = useApp();
  const { documents, loading: loadingDocs } = useDocumentsByCompany(companyId);
  const { vehicles, loading: loadingVehicles } = useFleet(companyId);
  const { drivers, loading: loadingDrivers } = useDrivers(companyId);
  const { company, loading: loadingCompany } = useCompany(userId);

  const loading = loadingDocs || loadingVehicles || loadingDrivers || loadingCompany;

  // Sub-overlay: open DocumentVault for a specific entity
  const [vaultEntity, setVaultEntity] = useState<{
    entityId: string;
    entityType: DocumentEntityType;
    entityName: string;
  } | null>(null);

  const entityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (company) map.set(company.id, company.name);
    vehicles.forEach((v) => map.set(v.id, v.plate));
    drivers.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [company, vehicles, drivers]);

  const alerts = useMemo<DocAlert[]>(() => {
    return documents
      .map((doc) => {
        const { status, daysRemaining } = getDocumentStatus(doc);
        return {
          doc,
          entityName: entityNameMap.get(doc.entityId) ?? doc.entityId,
          status,
          daysRemaining,
        };
      })
      .filter((a) => a.status !== 'no_expiry')  // only docs with expiry dates in alerts
      .sort((a, b) => {
        const ORDER: Record<DocumentStatus, number> = {
          expired: 0,
          expiring_soon: 1,
          valid: 2,
          no_expiry: 3,
        };
        return ORDER[a.status] - ORDER[b.status];
      });
  }, [documents, entityNameMap]);

  const expired = alerts.filter((a) => a.status === 'expired');
  const expiring = alerts.filter((a) => a.status === 'expiring_soon');
  const valid = alerts.filter((a) => a.status === 'valid');

  const renderAlert = (alert: DocAlert) => (
    <button
      key={alert.doc.id}
      onClick={() =>
        setVaultEntity({
          entityId: alert.doc.entityId,
          entityType: alert.doc.entityType,
          entityName: alert.entityName,
        })
      }
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-opacity hover:opacity-80 ${STATUS_STYLES[alert.status]}`}
    >
      <div className="flex-shrink-0">{STATUS_ICONS[alert.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 opacity-60">
            {ENTITY_ICONS[alert.doc.entityType]}
          </span>
          <span className="font-mono text-xs font-bold">{alert.entityName}</span>
          <span className="text-xs opacity-80">
            · {DOC_TYPE_LABELS[alert.doc.docType] ?? alert.doc.docType}
          </span>
        </div>
        {alert.daysRemaining !== undefined && (
          <p className="text-xs opacity-70 mt-0.5">
            {alert.daysRemaining >= 0
              ? t('daysRemaining').replace('{n}', String(alert.daysRemaining))
              : t('daysOverdue').replace('{n}', String(Math.abs(alert.daysRemaining)))}
          </p>
        )}
      </div>
      <span className="text-[10px] opacity-50">→</span>
    </button>
  );

  return (
    <>
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
              <FileText size={22} className="text-brand-yellow" />
              <div>
                <h1 className="font-display text-white font-bold text-lg leading-tight">
                  {t('documentsDashboard')}
                </h1>
                <p className="text-white/50 text-xs">
                  {expired.length > 0 && (
                    <span className="text-red-400">
                      {expired.length} vencido{expired.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {expired.length > 0 && expiring.length > 0 && ' · '}
                  {expiring.length > 0 && (
                    <span className="text-yellow-400">
                      {expiring.length} próximo{expiring.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {expired.length === 0 && expiring.length === 0 && documents.length > 0 && (
                    <span className="text-green-400">{t('allDocsValid')}</span>
                  )}
                  {documents.length === 0 && !loading && (
                    <span>{t('noDocumentsYet')}</span>
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

          {/* Quick-access entity buttons */}
          {!loading && (
            <div className="flex gap-2 pb-4 overflow-x-auto">
              {company && (
                <button
                  onClick={() =>
                    setVaultEntity({ entityId: company.id, entityType: 'company', entityName: company.name })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/70 text-xs flex-shrink-0 transition-colors"
                >
                  <Building2 size={12} /> {t('myCompany')}
                </button>
              )}
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() =>
                    setVaultEntity({ entityId: v.id, entityType: 'vehicle', entityName: v.plate })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/70 text-xs flex-shrink-0 font-mono transition-colors"
                >
                  <Car size={12} /> {v.plate}
                </button>
              ))}
              {drivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() =>
                    setVaultEntity({ entityId: d.id, entityType: 'driver', entityName: d.name })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/70 text-xs flex-shrink-0 transition-colors"
                >
                  <Users size={12} /> {d.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              Cargando…
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3 text-center">
              <CheckCircle size={48} className="text-green-400/50" />
              <p className="text-sm">
                {documents.length === 0 ? t('noDocumentsYet') : t('allDocsValid')}
              </p>
              <p className="text-xs text-white/25">
                Usa los botones de arriba para gestionar documentos por entidad.
              </p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto pt-2 space-y-5">
              {expired.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {t('docStatusExpired')} ({expired.length})
                  </p>
                  {expired.map(renderAlert)}
                </div>
              )}
              {expiring.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} />
                    {t('docStatusExpiring')} ({expiring.length})
                  </p>
                  {expiring.map(renderAlert)}
                </div>
              )}
              {valid.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={12} />
                    {t('docStatusValid')} ({valid.length})
                  </p>
                  {valid.map(renderAlert)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DocumentVault sub-overlay */}
      {vaultEntity && (
        <DocumentVault
          entityId={vaultEntity.entityId}
          entityType={vaultEntity.entityType}
          entityName={vaultEntity.entityName}
          companyId={companyId}
          onClose={() => setVaultEntity(null)}
          zIndex="z-[60]"
        />
      )}
    </>
  );
};

export default DocumentsDashboard;
