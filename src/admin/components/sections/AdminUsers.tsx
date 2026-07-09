import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { RefreshCw, Search, Download, FileText } from 'lucide-react';
import type { AdminUserRow } from '../../hooks/useAdminData';
import { exportToCSV, exportToPDF, type ExportColumn } from '../../utils/adminExport';

const PAGE_SIZE = 20;

const PLAN_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  oro: 'default', plata: 'secondary', bronce: 'outline', free: 'outline',
};

export default function AdminUsers() {
  const { t } = useApp();
  const { users, loading, refresh, usersHasMore, loadingMoreUsers, loadMoreUsers } = useAdminData();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'driver'>('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (q && !u.displayName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && u.userType !== typeFilter) return false;
      if (planFilter !== 'all' && u.tier !== planFilter) return false;
      return true;
    });
  }, [users, search, typeFilter, planFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page_data = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportColumns: ExportColumn<AdminUserRow>[] = [
    { header: 'Name', accessor: (u) => u.displayName },
    { header: 'Email', accessor: (u) => u.email },
    { header: 'Type', accessor: (u) => u.userType },
    { header: 'Plan', accessor: (u) => u.tier ?? 'free' },
    { header: 'Registered', accessor: (u) => u.createdAt ? u.createdAt.toLocaleDateString() : '' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('adminUsers')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV('urban-drive-users', filtered, exportColumns)}>
            <Download className="h-4 w-4 mr-2" />
            {t('adminExportCSV')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(t('adminUsers'), filtered, exportColumns)}>
            <FileText className="h-4 w-4 mr-2" />
            {t('adminExportPDF')}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('adminRefresh')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('adminSearch')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-8"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(0); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t('adminFilterByType')}</option>
          <option value="user">{t('typeUser')}</option>
          <option value="driver">{t('typeDriver')}</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t('adminFilterByPlan')}</option>
          <option value="free">{t('planFree')}</option>
          <option value="bronce">{t('planBronce')}</option>
          <option value="plata">{t('planPlata')}</option>
          <option value="oro">{t('planOro')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">User</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Email</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Plan</th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Registered</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : page_data.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
            ) : page_data.map((u) => (
              <tr
                key={`${u.userType}-${u.id}`}
                className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelected(u)}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback className="text-xs">{u.displayName.slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[120px]">{u.displayName || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell truncate max-w-[180px]">{u.email}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-xs">{u.userType === 'driver' ? t('typeDriver') : t('typeUser')}</Badge>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  {u.tier ? <Badge variant={PLAN_VARIANT[u.tier] ?? 'outline'} className="text-xs capitalize">{u.tier}</Badge> : '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                  {u.createdAt ? u.createdAt.toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(totalPages > 1 || usersHasMore) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} users</span>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="flex items-center px-2">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </>
            )}
            {usersHasMore && (
              <Button variant="outline" size="sm" disabled={loadingMoreUsers} onClick={loadMoreUsers}>
                {loadingMoreUsers ? 'Loading…' : t('adminLoadMore')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selected.photoURL} />
                  <AvatarFallback>{selected.displayName.slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selected.displayName || '—'}</p>
                  <p className="text-muted-foreground">{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">UID:</span> <span className="font-mono text-xs break-all">{selected.id}</span></div>
                <div><span className="text-muted-foreground">Type:</span> {selected.userType}</div>
                <div><span className="text-muted-foreground">Plan:</span> {selected.tier ?? 'free'}</div>
                <div><span className="text-muted-foreground">Registered:</span> {selected.createdAt?.toLocaleDateString() ?? '—'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
