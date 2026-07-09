import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { RefreshCw, Search, Download, FileText } from 'lucide-react';
import type { AdminCompanyRow } from '../../hooks/useAdminData';
import { exportToCSV, exportToPDF, type ExportColumn } from '../../utils/adminExport';

const TIER_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  oro: 'default', plata: 'secondary', bronce: 'outline', free: 'outline',
};

export default function AdminCompanies() {
  const { t } = useApp();
  const { companies, loading, refresh } = useAdminData();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selected, setSelected] = useState<AdminCompanyRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter((c) => {
      if (q && !c.companyName.toLowerCase().includes(q) && !(c.taxId ?? '').toLowerCase().includes(q)) return false;
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      return true;
    });
  }, [companies, search, tierFilter]);

  const exportColumns: ExportColumn<AdminCompanyRow>[] = [
    { header: 'Company', accessor: (c) => c.companyName },
    { header: 'Tax ID', accessor: (c) => c.taxId ?? '' },
    { header: 'Tier', accessor: (c) => c.tier ?? 'free' },
    { header: 'Vehicles', accessor: (c) => c.vehicleCount },
    { header: 'Drivers', accessor: (c) => c.driverCount },
    { header: 'Created', accessor: (c) => c.createdAt ? c.createdAt.toLocaleDateString() : '' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('adminCompanies')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV('urban-drive-companies', filtered, exportColumns)}>
            <Download className="h-4 w-4 mr-2" />
            {t('adminExportCSV')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(t('adminCompanies'), filtered, exportColumns)}>
            <FileText className="h-4 w-4 mr-2" />
            {t('adminExportPDF')}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('adminRefresh')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('adminSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t('adminFilterByPlan')}</option>
          <option value="free">{t('planFree')}</option>
          <option value="bronce">{t('planBronce')}</option>
          <option value="plata">{t('planPlata')}</option>
          <option value="oro">{t('planOro')}</option>
        </select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Company</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">NIT/Tax ID</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Tier</th>
              <th className="text-left px-3 py-2 font-medium">Vehicles</th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
            ) : filtered.map((c) => (
              <tr
                key={c.id}
                className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelected(c)}
              >
                <td className="px-3 py-2 font-medium truncate max-w-[180px]">{c.companyName || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{c.taxId ?? '—'}</td>
                <td className="px-3 py-2 hidden md:table-cell">
                  {c.tier ? <Badge variant={TIER_VARIANT[c.tier] ?? 'outline'} className="text-xs capitalize">{c.tier}</Badge> : '—'}
                </td>
                <td className="px-3 py-2 text-center">{c.vehicleCount}</td>
                <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                  {c.createdAt ? c.createdAt.toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.companyName}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tax ID:</span> {selected.taxId ?? '—'}</div>
                <div><span className="text-muted-foreground">Tier:</span> {selected.tier ?? 'free'}</div>
                <div><span className="text-muted-foreground">Vehicles:</span> {selected.vehicleCount}</div>
                <div><span className="text-muted-foreground">Drivers:</span> {selected.driverCount}</div>
                <div><span className="text-muted-foreground">Modalities:</span> {(selected.modalities ?? []).join(', ') || '—'}</div>
                <div><span className="text-muted-foreground">Created:</span> {selected.createdAt?.toLocaleDateString() ?? '—'}</div>
              </div>
              <div><span className="text-muted-foreground">Owner ID:</span> <span className="font-mono text-xs break-all">{selected.ownerId ?? '—'}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
