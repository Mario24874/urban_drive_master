/**
 * AdminAdmins — Admin management section for the Admin Portal (superadmin only)
 *
 * Lists admins/{uid} docs and lets a superadmin invite an existing Urban Drive
 * user (looked up by email in `users`) as a new admin, or revoke access.
 */

import { useEffect, useState } from 'react';
import {
  collection, getDocs, query, where, doc, setDoc, deleteDoc, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db, auth } from '../../../services/firebase';
import { useApp } from '../../../contexts/AppContext';
import { toast } from 'sonner';
import { Plus, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminUser } from '../../types';

interface AdminRow {
  id: string;
  email: string;
  role: 'superadmin' | 'admin';
  createdAt?: Date;
}

interface Props {
  currentUser: AdminUser;
}

export default function AdminAdmins({ currentUser }: Props) {
  const { t } = useApp();

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'superadmin'>('admin');
  const [inviting, setInviting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminRow | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'admins'), orderBy('createdAt', 'desc')));
      const list: AdminRow[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email ?? '',
          role: data.role ?? 'admin',
          createdAt: data.createdAt?.toDate?.(),
        };
      });
      setAdmins(list);
    } catch (err) {
      console.error(err);
      toast.error(t('adminAdminsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
      if (usersSnap.empty) {
        toast.error(t('adminAdminsUserNotFound'));
        return;
      }
      const targetUid = usersSnap.docs[0].id;

      if (admins.some((a) => a.id === targetUid)) {
        toast.error(t('adminAdminsAlreadyAdmin'));
        return;
      }

      await setDoc(doc(db, 'admins', targetUid), {
        email,
        role: inviteRole,
        createdAt: serverTimestamp(),
        invitedBy: auth.currentUser?.uid ?? null,
      });

      toast.success(t('adminAdminsInvited'), { description: email });
      setShowModal(false);
      setInviteEmail('');
      setInviteRole('admin');
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('adminAdminsLoadError');
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await deleteDoc(doc(db, 'admins', revokeTarget.id));
      toast.success(t('adminAdminsRevoked'));
      setRevokeTarget(null);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('adminAdminsLoadError');
      toast.error(message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold">{t('adminAdmins')}</h1>
            <p className="text-sm text-muted-foreground">
              {admins.length} {admins.length === 1 ? 'admin' : 'admins'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('adminRefresh')}
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('adminAdminsInvite')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('adminAdminsRole')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('adminAdminsSince')}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t('adminAdminsActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{a.email || <span className="font-mono text-xs text-muted-foreground">{a.id}</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        a.role === 'superadmin'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                      }`}>
                        {a.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.createdAt ? a.createdAt.toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRevokeTarget(a)}
                        disabled={a.id === currentUser.uid}
                        title={a.id === currentUser.uid ? t('adminAdminsCannotRevokeSelf') : t('adminAdminsRevoke')}
                        className="p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{t('adminAdminsInvite')}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">{t('adminAdminsInviteHint')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('adminAdminsRole')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'superadmin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setInviteRole(role)}
                    className={`py-2 px-1 rounded-lg border text-xs font-semibold capitalize transition-all ${
                      inviteRole === role
                        ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                        : 'border-border text-muted-foreground hover:border-blue-500/50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button className="flex-1" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? <RefreshCw className="h-4 w-4 animate-spin" /> : t('adminAdminsInvite')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">{t('adminAdminsRevoke')}</h2>
            <p className="text-sm text-muted-foreground">
              {revokeTarget.email}
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setRevokeTarget(null)}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleRevoke} disabled={revoking}>
                {revoking ? <RefreshCw className="h-4 w-4 animate-spin" /> : t('adminAdminsRevoke')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
