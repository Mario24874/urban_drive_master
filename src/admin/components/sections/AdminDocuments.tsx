import { useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Button } from '../../../components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getDocumentStatus } from '../../../features/enterprise/types/documents';
import type { DocumentRecord } from '../../../features/enterprise/types/documents';

type DocStatus = 'valid' | 'expiring_soon' | 'expired' | 'no_expiry';

const STATUS_STYLES: Record<DocStatus, string> = {
  valid:         'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  expiring_soon: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  expired:       'bg-red-500/15 text-red-600 border-red-500/30',
  no_expiry:     'bg-muted text-muted-foreground border-border',
};

interface CompanyCompliance {
  companyId: string;
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  pct: number;
}

export default function AdminDocuments() {
  const { t } = useApp();
  const { documents, companies, loading, refresh } = useAdminData();

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of companies) map[c.id] = c.companyName;
    return map;
  }, [companies]);

  // Compliance per company
  const complianceByCompany = useMemo(() => {
    const map: Record<string, CompanyCompliance> = {};
    for (const doc of documents) {
      if (!map[doc.companyId]) {
        map[doc.companyId] = { companyId: doc.companyId, total: 0, valid: 0, expiring: 0, expired: 0, pct: 0 };
      }
      const entry = map[doc.companyId];
      entry.total++;
      // Build fake record for status calculation
      const fakeRecord: DocumentRecord = {
        id: doc.id,
        companyId: doc.companyId,
        entityId: doc.entityId,
        entityType: doc.entityType as DocumentRecord['entityType'],
        docType: doc.docType as DocumentRecord['docType'],
        name: doc.name,
        expiryDate: doc.expiryDate,
        isVerified: doc.isVerified ?? false,
        createdAt: new Date(),
      };
      const { status } = getDocumentStatus(fakeRecord);
      if (status === 'valid' || status === 'no_expiry') entry.valid++;
      else if (status === 'expiring_soon') entry.expiring++;
      else if (status === 'expired') entry.expired++;
    }
    for (const c of Object.values(map)) {
      c.pct = c.total > 0 ? Math.round((c.valid / c.total) * 100) : 0;
    }
    return Object.values(map).sort((a, b) => a.pct - b.pct);
  }, [documents]);

  // Document table
  const docRows = useMemo(() => {
    return documents.map((doc) => {
      const fakeRecord: DocumentRecord = {
        id: doc.id,
        companyId: doc.companyId,
        entityId: doc.entityId,
        entityType: doc.entityType as DocumentRecord['entityType'],
        docType: doc.docType as DocumentRecord['docType'],
        name: doc.name,
        expiryDate: doc.expiryDate,
        isVerified: doc.isVerified ?? false,
        createdAt: new Date(),
      };
      const { status } = getDocumentStatus(fakeRecord);
      return { ...doc, status, companyName: companyMap[doc.companyId] ?? doc.companyId };
    });
  }, [documents, companyMap]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('adminDocuments')}</h1>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('adminRefresh')}
        </Button>
      </div>

      {/* Compliance by company */}
      {complianceByCompany.length > 0 && (
        <div className="rounded-md border p-4 space-y-3">
          <h2 className="font-semibold text-sm">Compliance by Company</h2>
          {complianceByCompany.map((c) => (
            <div key={c.companyId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{companyMap[c.companyId] ?? c.companyId}</span>
                <span className="text-muted-foreground ml-2 shrink-0">
                  {c.valid}/{c.total} ({c.pct}%)
                  {c.expired > 0 && <span className="text-red-500 ml-1">· {c.expired} expired</span>}
                  {c.expiring > 0 && <span className="text-yellow-500 ml-1">· {c.expiring} expiring</span>}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.pct >= 80 ? 'bg-emerald-500' : c.pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents table */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Document</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Company</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Entity</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : docRows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
            ) : docRows.map((doc) => (
              <tr key={doc.id} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-medium truncate max-w-[160px]">{doc.name}</td>
                <td className="px-3 py-2 text-muted-foreground truncate hidden sm:table-cell">{doc.companyName}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize hidden md:table-cell">{doc.entityType}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_STYLES[doc.status as DocStatus] ?? STATUS_STYLES.no_expiry}`}>
                    {t(`docStatus${doc.status === 'expiring_soon' ? 'Expiring' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1).replace('_', '')}`)}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                  {doc.expiryDate ? doc.expiryDate.toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
