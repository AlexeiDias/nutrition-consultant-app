// Firestore data access layer for the nutrition consultant app
//src/lib/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  Client,
  DailyLog,
  NutritionPlan,
  ActionPlan,
  ConsultantProfile,
} from './types';

// ── Users ──────────────────────────────────────────
export const createUserProfile = async (
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt'>
) => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  await updateDoc(doc(db, 'users', uid), data);
};

// ── Consultant Extended Profile ────────────────────
export const getConsultantProfile = async (uid: string): Promise<ConsultantProfile | null> => {
  const snap = await getDoc(doc(db, 'profiles', uid));
  return snap.exists() ? (snap.data() as ConsultantProfile) : null;
};

export const upsertConsultantProfile = async (
  uid: string,
  data: Partial<ConsultantProfile>
) => {
  await setDoc(doc(db, 'profiles', uid), {
    uid,
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ── Clients ────────────────────────────────────────
export const createClient = async (data: Omit<Client, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'clients'), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getClientsByConsultant = async (consultantId: string): Promise<Client[]> => {
  const q = query(
    collection(db, 'clients'),
    where('consultantId', '==', consultantId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
};

export const getClientById = async (clientId: string): Promise<Client | null> => {
  const snap = await getDoc(doc(db, 'clients', clientId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Client) : null;
};

export const updateClient = async (clientId: string, data: Partial<Client>) => {
  await updateDoc(doc(db, 'clients', clientId), data);
};

export const deleteClient = async (clientId: string) => {
  await deleteDoc(doc(db, 'clients', clientId));
};

// ── Daily Logs ─────────────────────────────────────
export const createDailyLog = async (data: Omit<DailyLog, 'id'>) => {
  return await addDoc(collection(db, 'dailyLogs'), { ...data });
};

export const getLogsByClient = async (clientId: string): Promise<DailyLog[]> => {
  const q = query(
    collection(db, 'dailyLogs'),
    where('clientId', '==', clientId)
  );
  const snap = await getDocs(q);
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyLog));
  return logs.sort((a, b) => {
    const dateA = (a.date as any)?.seconds ?? 0;
    const dateB = (b.date as any)?.seconds ?? 0;
    return dateB - dateA;
  });
};

export const updateDailyLog = async (logId: string, data: Partial<DailyLog>) => {
  await updateDoc(doc(db, 'dailyLogs', logId), data);
};

// ── Action Plans ───────────────────────────────────
export const createActionPlan = async (data: Omit<ActionPlan, 'id'>) => {
  return await addDoc(collection(db, 'actionPlans'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getActionPlansByClient = async (clientId: string): Promise<ActionPlan[]> => {
  const q = query(
    collection(db, 'actionPlans'),
    where('clientId', '==', clientId)
  );
  const snap = await getDocs(q);
  const plans = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActionPlan));
  return plans.sort((a, b) => {
    const dateA = (a.createdAt as any)?.seconds ?? 0;
    const dateB = (b.createdAt as any)?.seconds ?? 0;
    return dateB - dateA;
  });
};

export const getActionPlansByConsultant = async (
  consultantId: string
): Promise<ActionPlan[]> => {
  const q = query(
    collection(db, 'actionPlans'),
    where('consultantId', '==', consultantId)
  );
  const snap = await getDocs(q);
  const plans = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActionPlan));
  return plans.sort((a, b) => {
    const dateA = (a.createdAt as any)?.seconds ?? 0;
    const dateB = (b.createdAt as any)?.seconds ?? 0;
    return dateB - dateA;
  });
};

export const getActionPlanById = async (planId: string): Promise<ActionPlan | null> => {
  const snap = await getDoc(doc(db, 'actionPlans', planId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ActionPlan) : null;
};

export const updateActionPlan = async (
  planId: string,
  data: Partial<ActionPlan>
) => {
  await updateDoc(doc(db, 'actionPlans', planId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteActionPlan = async (planId: string) => {
  await deleteDoc(doc(db, 'actionPlans', planId));
};

// ── Nutrition Plans ────────────────────────────────
export const createNutritionPlan = async (data: Omit<NutritionPlan, 'id'>) => {
  return await addDoc(collection(db, 'nutritionPlans'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getPlansByClient = async (clientId: string): Promise<NutritionPlan[]> => {
  const q = query(
    collection(db, 'nutritionPlans'),
    where('clientId', '==', clientId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NutritionPlan));
};