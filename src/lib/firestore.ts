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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Client, DailyLog, NutritionPlan } from './types';

// ── Users ──────────────────────────────────────────
export const createUserProfile = async (uid: string, data: Omit<UserProfile, 'uid' | 'createdAt'>) => {
  await updateDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() })
    .catch(async () => {
      // Doc doesn't exist yet, use setDoc
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', uid), { uid, ...data, createdAt: serverTimestamp() });
    });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// ── Clients ────────────────────────────────────────
export const createClient = async (data: Omit<Client, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'clients'), { ...data, createdAt: serverTimestamp() });
};

export const getClientsByConsultant = async (consultantId: string): Promise<Client[]> => {
  const q = query(collection(db, 'clients'), where('consultantId', '==', consultantId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
};

export const getClientById = async (clientId: string): Promise<Client | null> => {
  const snap = await getDoc(doc(db, 'clients', clientId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Client) : null;
};

export const updateClient = async (clientId: string, data: Partial<Client>) => {
  await updateDoc(doc(db, 'clients', clientId), data);
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
  const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyLog));
  return logs.sort((a, b) => {
    const dateA = (a.date as any)?.seconds
      ? (a.date as any).seconds
      : new Date(a.date).getTime() / 1000;
    const dateB = (b.date as any)?.seconds
      ? (b.date as any).seconds
      : new Date(b.date).getTime() / 1000;
    return dateB - dateA;
  });
};

// ── Nutrition Plans ────────────────────────────────
export const createNutritionPlan = async (data: Omit<NutritionPlan, 'id'>) => {
  return await addDoc(collection(db, 'nutritionPlans'), { ...data, updatedAt: serverTimestamp() });
};

export const getPlansByClient = async (clientId: string): Promise<NutritionPlan[]> => {
  const q = query(collection(db, 'nutritionPlans'), where('clientId', '==', clientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NutritionPlan));
};