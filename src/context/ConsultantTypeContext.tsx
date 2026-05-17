// src/context/ConsultantTypeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConsultantType, ToolPreferences, getConfig, CONSULTANT_TYPE_CONFIGS } from '@/lib/consultant-type';

interface ConsultantTypeContextType {
  consultantType: ConsultantType;
  customTypeName: string;
  toolPreferences: ToolPreferences;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultTools: ToolPreferences = {
  aiMealPlan: true,
  mealsBuilder: true,
  calorieCalculator: true,
  tasksSection: true,
};

const ConsultantTypeContext = createContext<ConsultantTypeContextType>({
  consultantType: 'nutritionist',
  customTypeName: '',
  toolPreferences: defaultTools,
  loading: true,
  refresh: async () => {},
});

export function ConsultantTypeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [consultantType, setConsultantType] = useState<ConsultantType>('nutritionist');
  const [customTypeName, setCustomTypeName] = useState('');
  const [toolPreferences, setToolPreferences] = useState<ToolPreferences>(defaultTools);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!profile?.uid) { setLoading(false); return; }
    try {
      const snap = await getDoc(doc(db, 'profiles', profile.uid));
      if (snap.exists()) {
        const data = snap.data();
        const type = (data.consultantType as ConsultantType) ?? 'nutritionist';
        setConsultantType(type);
        setCustomTypeName(data.customTypeName ?? '');
        // Use saved tool prefs, or fall back to type defaults
        setToolPreferences(
          data.toolPreferences ?? CONSULTANT_TYPE_CONFIGS[type]?.defaultTools ?? defaultTools
        );
      }
    } catch (err) {
      console.error('Failed to load consultant type:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [profile]);

  return (
    <ConsultantTypeContext.Provider value={{
      consultantType,
      customTypeName,
      toolPreferences,
      loading,
      refresh: fetchProfile,
    }}>
      {children}
    </ConsultantTypeContext.Provider>
  );
}

export function useConsultantType() {
  return useContext(ConsultantTypeContext);
}
