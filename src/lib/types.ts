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

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export interface Client {
  id: string;
  consultantId: string;
  clientUserId: string;
  name: string;
  email: string;
  dob: string;
  gender: string;
  phone: string;
  age: number;
  height: number;
  activityLevel: ActivityLevel | '';
  medicalHistory: string;
  nutritionGoals: string;
  currentPlan: string;
  createdAt: Date;
}

export interface DailyLog {
  id: string;
  clientId: string;
  date: Date;
  mealsExperience: string;
  waterIntake: number;
  weight: number;
  symptoms: string;
  mood: string;
  exercise: string;
  bowelMovement: string;
  nightSleep: string;
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
  category: 'exercise' | 'hydration' | 'lifestyle';
  completed: boolean;
  completedAt: Date | null;
}

export type PlanStatus = 'draft' | 'reviewed' | 'approved';

export interface ActionPlan {
  id: string;
  consultantId: string;
  clientId: string;
  clientName: string;
  title: string;
  programGoal: string;
  programGoals: string[];
  planStatus: PlanStatus;
  tdee: number;
  startDate: Date;
  nextConsultation: Date;
  status: 'active' | 'completed' | 'archived';
  tasks: ActionPlanTask[];
  planDays: PlanDay[];
  startWeight: number | null;
  targetWeight: number | null;
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

export interface PlannedMealIngredient {
  id: string;
  name: string;
  quantity: number;
  calories: number;
}

export interface PlannedMeal {
  id: string;
  name: string;
  ingredients: PlannedMealIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

export type MealSlot = 'Breakfast' | 'Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner';

export interface MealItem {
  id: string;
  slot: MealSlot;
  name: string;
  ingredients: PlannedMealIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

export interface PlanDay {
  day: number;
  date: string;
  meals: MealItem[];
}

export type UnitSystem = 'metric' | 'imperial';

export interface Client {
  id: string;
  consultantId: string;
  clientUserId: string;
  name: string;
  email: string;
  dob: string;
  gender: string;
  phone: string;
  age: number;
  height: number;
  activityLevel: ActivityLevel | '';
  unitSystem: UnitSystem;
  medicalHistory: string;
  nutritionGoals: string;
  currentPlan: string;
  createdAt: Date;
}