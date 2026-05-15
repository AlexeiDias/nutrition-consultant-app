// src/context/UnitContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UnitSystem } from '@/lib/units';

interface UnitContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => Promise<void>;
  clientId: string | null;
  loadingUnits: boolean;
}

const UnitContext = createContext<UnitContextType>({
  unitSystem: 'metric',
  setUnitSystem: async () => {},
  clientId: null,
  loadingUnits: true,
});

export function UnitProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('metric');
  const [clientId, setClientId] = useState<string | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    if (!profile?.uid || profile.role !== 'client') {
      setLoadingUnits(false);
      return;
    }
    const fetchUnit = async () => {
      try {
        const q = query(
          collection(db, 'clients'),
          where('clientUserId', '==', profile.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setClientId(snap.docs[0].id);
          setUnitSystemState((data.unitSystem as UnitSystem) ?? 'metric');
        }
      } catch (err) {
        console.error('Failed to load unit preference:', err);
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnit();
  }, [profile]);

  const setUnitSystem = async (system: UnitSystem) => {
    setUnitSystemState(system);
    if (clientId) {
      try {
        await updateDoc(doc(db, 'clients', clientId), { unitSystem: system });
      } catch (err) {
        console.error('Failed to save unit preference:', err);
      }
    }
  };

  return (
    <UnitContext.Provider value={{ unitSystem, setUnitSystem, clientId, loadingUnits }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitContext);
}
