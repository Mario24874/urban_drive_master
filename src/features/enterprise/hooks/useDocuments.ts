import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { DocumentRecord } from '../types/documents';

export interface UseDocumentsResult {
  documents: DocumentRecord[];
  loading: boolean;
  addDocument: (data: Omit<DocumentRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateDocument: (id: string, data: Partial<DocumentRecord>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

function mapDoc(d: any): DocumentRecord {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    issueDate: data.issueDate?.toDate?.() ?? undefined,
    expiryDate: data.expiryDate?.toDate?.() ?? undefined,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  } as DocumentRecord;
}

function crudOps(): Pick<UseDocumentsResult, 'addDocument' | 'updateDocument' | 'deleteDocument'> {
  return {
    addDocument: async (data) => {
      await addDoc(collection(db, 'company_documents'), {
        ...data,
        issueDate: data.issueDate ?? null,
        expiryDate: data.expiryDate ?? null,
        createdAt: serverTimestamp(),
      });
    },
    updateDocument: async (id, data) => {
      await updateDoc(doc(db, 'company_documents', id), { ...data });
    },
    deleteDocument: async (id) => {
      await deleteDoc(doc(db, 'company_documents', id));
    },
  };
}

/** Documents for a specific entity (company, vehicle, or driver). */
export function useDocumentsByEntity(entityId: string | null): UseDocumentsResult {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'company_documents'),
      where('entityId', '==', entityId),
    );

    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map(mapDoc));
      setLoading(false);
    });

    return unsub;
  }, [entityId]);

  return { documents, loading, ...crudOps() };
}

/** All documents for a company — used by DocumentsDashboard. */
export function useDocumentsByCompany(companyId: string | null): UseDocumentsResult {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'company_documents'),
      where('companyId', '==', companyId),
    );

    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map(mapDoc));
      setLoading(false);
    });

    return unsub;
  }, [companyId]);

  return { documents, loading, ...crudOps() };
}
