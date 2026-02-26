import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useAdminData } from '../../hooks/useAdminData';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { RefreshCw, Search } from 'lucide-react';

export default function AdminFleet() {
  const { t } = useApp();
  const { vehicles, loading, refresh } = useAdminData();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(vehicles.map((v) => v.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles.filter((v) => {
      if (q && !v.plate.toLowerCase().includes(q) && !(v.make ?? '').toLowerCase().includes(q) && !(v.model ?? '').toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (activeFilter === 'active' && !v.isActive) return false;
      if (activeFilter === 'inactive' && v.isActive) return false;
      return true;
    });
  }, [vehicles, search, categoryFilter, activeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('adminFleet')}</h1>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('adminRefresh')}
        </Button>
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
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{t('vehicleCategory')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All status</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">{t('plate')}</th>
              <th className="text-left px-3 py-2 font-medium">{t('makeModel')}</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">{t('vehicleCategory')}</th>
              <th className="text-right px-3 py-2 font-medium hidden md:table-cell">Km</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">{t('adminNoData')}</td></tr>
            ) : filtered.map((v) => (
              <tr key={v.id} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-mono font-semibold">{v.plate}</td>
                <td className="px-3 py-2">{[v.make, v.model, v.year].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize hidden sm:table-cell">{v.category ?? '—'}</td>
                <td className="px-3 py-2 text-right hidden md:table-cell text-muted-foreground">
                  {v.currentMileageKm != null ? v.currentMileageKm.toLocaleString() : '—'}
                </td>
                <td className="px-3 py-2">
                  <Badge variant={v.isActive ? 'default' : 'outline'} className="text-xs">
                    {v.isActive ? t('active') : t('inactive')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} vehicles</p>
    </div>
  );
}
