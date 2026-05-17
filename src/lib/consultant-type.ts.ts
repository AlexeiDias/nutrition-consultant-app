// src/lib/consultant-type.ts

export type ConsultantType =
  | 'health_coach'
  | 'nutritionist'
  | 'registered_dietician'
  | 'personal_trainer'
  | 'custom';

export interface ToolPreferences {
  aiMealPlan: boolean;
  mealsBuilder: boolean;
  calorieCalculator: boolean;
  tasksSection: boolean;
}

export interface ConsultantTypeConfig {
  label: string;
  emoji: string;
  description: string;
  clientLabel: string;         // "clients" | "patients" | "athletes"
  actionPlanLabel: string;     // "Action Plan" | "Care Plan" | "Training Plan"
  tasksLabel: string;          // "Tasks" | "Goals" | "Workout Tasks"
  defaultTools: ToolPreferences;
}

export const CONSULTANT_TYPE_CONFIGS: Record<ConsultantType, ConsultantTypeConfig> = {
  health_coach: {
    label: 'Health Coach',
    emoji: '🧘',
    description: 'Behavior change, habit formation, lifestyle coaching',
    clientLabel: 'clients',
    actionPlanLabel: 'Program',
    tasksLabel: 'Goals',
    defaultTools: {
      aiMealPlan: false,
      mealsBuilder: false,
      calorieCalculator: true,
      tasksSection: true,
    },
  },
  nutritionist: {
    label: 'Nutritionist',
    emoji: '🥗',
    description: 'Nutrition planning, meal design, dietary guidance',
    clientLabel: 'clients',
    actionPlanLabel: 'Action Plan',
    tasksLabel: 'Tasks',
    defaultTools: {
      aiMealPlan: true,
      mealsBuilder: true,
      calorieCalculator: true,
      tasksSection: true,
    },
  },
  registered_dietician: {
    label: 'Registered Dietician',
    emoji: '👩‍⚕️',
    description: 'Clinical nutrition, medical dietary therapy',
    clientLabel: 'patients',
    actionPlanLabel: 'Care Plan',
    tasksLabel: 'Tasks',
    defaultTools: {
      aiMealPlan: true,
      mealsBuilder: true,
      calorieCalculator: true,
      tasksSection: true,
    },
  },
  personal_trainer: {
    label: 'Personal Trainer',
    emoji: '💪',
    description: 'Fitness, exercise programming, performance coaching',
    clientLabel: 'athletes',
    actionPlanLabel: 'Training Plan',
    tasksLabel: 'Workout Tasks',
    defaultTools: {
      aiMealPlan: false,
      mealsBuilder: false,
      calorieCalculator: true,
      tasksSection: true,
    },
  },
  custom: {
    label: 'Custom',
    emoji: '⚙️',
    description: 'Define your own practice type and tools',
    clientLabel: 'clients',
    actionPlanLabel: 'Action Plan',
    tasksLabel: 'Tasks',
    defaultTools: {
      aiMealPlan: true,
      mealsBuilder: true,
      calorieCalculator: true,
      tasksSection: true,
    },
  },
};

export const CONSULTANT_TYPES = Object.entries(CONSULTANT_TYPE_CONFIGS).map(
  ([key, config]) => ({ key: key as ConsultantType, ...config })
);

export function getConfig(type?: ConsultantType | string): ConsultantTypeConfig {
  return CONSULTANT_TYPE_CONFIGS[(type as ConsultantType) ?? 'nutritionist'] ??
    CONSULTANT_TYPE_CONFIGS.nutritionist;
}

export const TOOL_LABELS: Record<keyof ToolPreferences, string> = {
  aiMealPlan: '✨ AI Meal Plan Generator',
  mealsBuilder: '🍽️ Meals Builder',
  calorieCalculator: '🧮 Calorie Calculator',
  tasksSection: '✅ Tasks / Goals Section',
};
