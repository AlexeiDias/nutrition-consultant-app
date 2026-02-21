// src/lib/types.ts
export type UserRole = 'consultant' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface ConsultantProfile {
  uid: string;
  bio: string;
  credentials: string;
  specializations: string[];
  phone: string;
  photoUrl: string;
  isPublic: boolean;
  updatedAt: Date;
}

export interface ClientProfile {
  uid: string;
  phone: string;
  photoUrl: string;
  updatedAt: Date;
}

export interface Client {
  id: string;
  consultantId: string;
  clientUserId: string;
  name: string;
  email: string;
  dob: string;
  gender: string;
  phone: string;
  medicalHistory: string;
  nutritionGoals: string;
  currentPlan: string;
  createdAt: Date;
}

export interface DailyLog {
  id: string;
  clientId: string;
  date: Date;
  meals: Meal[];
  waterIntake: number;
  weight: number;
  symptoms: string;
  mood: string;
  exercise: string;
  notes: string;
  reportSent: boolean;
}

export interface Meal {
  time: string;
  description: string;
  calories: number;
}

export interface ActionPlanTask {
  id: string;
  title: string;
  description: string;
  category: 'nutrition' | 'exercise' | 'hydration' | 'lifestyle';
  completed: boolean;
  completedAt: Date | null;
}

export interface ActionPlan {
  id: string;
  consultantId: string;
  clientId: string;
  clientName: string;
  title: string;
  startDate: Date;
  nextConsultation: Date;
  status: 'active' | 'completed' | 'archived';
  tasks: ActionPlanTask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  consultantId: string;
  planDetails: string;
  startDate: Date;
  endDate: Date;
  goals: string[];
  updatedAt: Date;
}