//src/lib/types.ts
export type UserRole = 'consultant' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
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