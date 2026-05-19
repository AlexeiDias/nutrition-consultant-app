# 🥗 Nutrition Consultant App

A full-stack web application that connects nutrition consultants with their clients. Consultants can build AI-powered meal plans, track client progress, send daily reports, and message clients in real time. Clients can view their plans, log daily health data, monitor their progress, and communicate directly with their consultant.

**Live Demo:** [nutrition-consultant-app.vercel.app](https://nutrition-consultant-app.vercel.app)

---

## Features

### 👩‍⚕️ Consultant Portal

**Practice Type System**
- Choose from Health Coach, Nutritionist, Registered Dietician, Personal Trainer, or Custom
- Each type sets smart default tools and labels (e.g. "Care Plan" for Dieticians, "Training Plan" for Trainers, "Goals" for Health Coaches)
- Fully customizable — toggle any tool on or off regardless of practice type

**Client Management**
- Add and manage clients with personal info, health goals, and clinical notes
- Body metrics: age, height, activity level for TDEE calculation
- Imperial/metric unit preference per client
- TDEE (Total Daily Energy Expenditure) displayed on client profile using Mifflin-St Jeor equation

**AI Meal Plan Generator**
- Generates a full day-by-day meal plan using Claude AI based on the client's program goals
- Supports all goals: Weight loss, Muscle gain, Diabetes management, Heart health, Sports performance, Gut health, General healthy eating, or Custom
- Multiple goals can be selected simultaneously (e.g. Weight loss + Diabetes management)
- Calorie targets calculated from client's TDEE — deficit for weight loss, surplus for muscle gain
- Each meal includes ingredients with quantities and calories
- 5 meals per day: Breakfast, Snack, Lunch, Afternoon Snack, Dinner

**Meals Builder**
- Edit any AI-generated meal using an inline calorie calculator
- Search 3M+ foods via Open Food Facts API (no API key required)
- Adjust serving sizes and recalculate calories in real time
- Manual meal building available when AI generator is disabled

**Draft/Review Safety Flow**
- All AI-generated plans save as Draft with a clinical safety disclaimer
- Consultant reviews meals for accuracy and marks plan as Reviewed
- Client sees pending/reviewed status badge on their plan

**Action Plans**
- Create plans with tasks categorized as Exercise, Hydration, or Lifestyle
- Labels adapt to practice type (Tasks / Goals / Workout Tasks)
- Set start/end dates, starting weight, and target weight
- Progress bar showing task completion

**PDF Export**
- Export full action plan as a professionally formatted PDF
- Includes plan details, TDEE, weight goals, all tasks, and complete day-by-day meal plan with macros and ingredients
- Available in both consultant and client portals

**Calorie Calculator**
- Standalone calculator in the consultant sidebar
- Search any food, adjust grams, build meals with running calorie totals

**Reports**
- View all client daily logs in one place
- See mood, water intake, weight, meals experience, exercise, symptoms, bowel movement, sleep

**Email Reports**
- Send or resend daily summary reports to consultant email
- Report includes all logged fields: vitals, meals, exercise, symptoms, bowel movement, sleep, notes

**Real-Time Messaging**
- One conversation thread per client
- Messages appear instantly without refreshing (Firestore real-time listeners)
- Read receipts
- Email notification sent to recipient when new message arrives
- Unread message count badges on sidebar

**Profile**
- Edit bio, credentials, specializations, phone, email
- Set practice type and customize tool preferences

---

### 📱 Client Portal

**My Plan**
- View the full day-by-day meal plan with ingredients and calories
- Two progress bars: program day countdown and task completion
- Plan status badge: pending review or reviewed by consultant
- Weight goal cards (starting and target)
- Export plan as PDF
- Unit toggle: switch between metric and imperial at any time

**Log Today**
- Water intake (L or fl oz)
- Weight — optional, recommended first and last day only
- Mood selector
- Symptoms
- Exercise experience
- Meals experience
- Bowel movement notes
- Night sleep notes
- Additional notes
- All values stored in metric, displayed in client's preferred units

**My Stats**
- Charts for water intake, weight, and mood trends over time

**History**
- View all past daily logs
- Resend email reports

**Messages**
- Real-time chat with consultant
- Messages appear instantly
- Email notification when consultant sends a message

**My Consultant**
- View consultant's public profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Real-time | Firestore onSnapshot listeners |
| AI Meal Plans | Anthropic Claude API (claude-opus-4-6) |
| Food Database | Open Food Facts API (free, no key required) |
| Email | Nodemailer + Gmail |
| PDF Export | jsPDF |
| Charts | Recharts |
| Deployment | Vercel |
| Cron Jobs | Vercel Cron (daily reminders at 8AM UTC) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Authentication and Firestore enabled
- Gmail account with App Password enabled
- Anthropic API key

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/nutrition-consultant-app.git
cd nutrition-consultant-app
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Email (Gmail)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Anthropic AI
ANTHROPIC_API_KEY=

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Cron protection
CRON_SECRET=
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── consultant/              # Consultant portal pages
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── action-plans/
│   │   ├── calculator/
│   │   ├── messages/
│   │   ├── reports/
│   │   └── profile/
│   ├── client/                  # Client portal pages
│   │   ├── dashboard/
│   │   ├── log/
│   │   ├── plan/
│   │   ├── messages/
│   │   ├── stats/
│   │   ├── history/
│   │   └── consultant/
│   └── api/                     # API routes
│       ├── generate-meal-plan/
│       ├── send-report/
│       ├── send-reminder/
│       ├── send-message-notification/
│       ├── update-client-email/
│       └── update-consultant-email/
├── components/
│   ├── consultant/              # Consultant-specific components
│   │   ├── Sidebar.tsx
│   │   ├── CalorieCalculator.tsx
│   │   └── MealsBuilder.tsx
│   ├── client/                  # Client-specific components
│   │   ├── ClientSidebar.tsx
│   │   └── UnitToggle.tsx
│   ├── shared/                  # Shared between portals
│   │   └── MessageThread.tsx
│   └── ui/                      # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── LoadingSpinner.tsx
│       └── ExportPDFButton.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── UnitContext.tsx
│   └── ConsultantTypeContext.tsx
└── lib/
    ├── firebase.ts
    ├── firebase-admin.ts
    ├── firestore.ts
    ├── email.ts
    ├── export-pdf.ts
    ├── units.ts
    ├── consultant-type.ts
    └── types.ts
```

---

## Key Data Models

### ActionPlan
```typescript
{
  consultantId, clientId, clientName,
  title, programGoal, programGoals,
  planStatus: 'draft' | 'reviewed' | 'approved',
  tdee, status,
  startDate, nextConsultation,
  startWeight, targetWeight,
  planDays: PlanDay[],
  tasks: ActionPlanTask[]
}
```

### PlanDay
```typescript
{
  day: number,
  date: string,
  meals: MealItem[]  // Breakfast, Snack, Lunch, Afternoon Snack, Dinner
}
```

### DailyLog
```typescript
{
  clientId, date,
  waterIntake, weight,
  mood, symptoms, exercise,
  mealsExperience, bowelMovement, nightSleep,
  notes, reportSent
}
```

### Message
```typescript
{
  conversationId,  // consultantId_clientId
  senderId, senderName, senderRole,
  text, createdAt, read
}
```

### ConsultantProfile
```typescript
{
  consultantType: 'health_coach' | 'nutritionist' | 'registered_dietician' | 'personal_trainer' | 'custom',
  customTypeName,
  toolPreferences: {
    aiMealPlan, mealsBuilder, calorieCalculator, tasksSection
  },
  bio, credentials, specializations, phone, isPublic
}
```

### Client
```typescript
{
  name, email, phone, dob, gender,
  age, height, activityLevel,
  unitSystem: 'metric' | 'imperial',
  medicalHistory, nutritionGoals, currentPlan
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /clients/{clientId} {
      allow read, write: if request.auth != null;
    }
    match /dailyLogs/{logId} {
      allow read, write: if request.auth != null;
    }
    match /actionPlans/{planId} {
      allow read, write: if request.auth != null;
    }
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Required Firestore Indexes

```
Collection: messages
Fields: conversationId (Ascending), createdAt (Ascending)
```

---

## Deployment

The app is deployed on Vercel. Push to the `main` branch to trigger an automatic deployment.

Make sure all environment variables from `.env.local` are added to **Vercel → Settings → Environment Variables**.

### Cron Job
A daily reminder email is sent to all clients at 8AM UTC via Vercel Cron. Configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/send-reminder",
    "schedule": "0 8 * * *"
  }]
}
```

---

## Consultant Practice Types

| Type | Client Label | Plan Label | Tasks Label | AI Meals | Meals Builder |
|---|---|---|---|---|---|
| Health Coach | Clients | Program | Goals | ❌ | ❌ |
| Nutritionist | Clients | Action Plan | Tasks | ✅ | ✅ |
| Registered Dietician | Patients | Care Plan | Tasks | ✅ | ✅ |
| Personal Trainer | Athletes | Training Plan | Workout Tasks | ❌ | ❌ |
| Custom | Clients | Action Plan | Tasks | ✅ | ✅ |

All tools can be individually toggled on or off regardless of practice type.

---

## Unit System

All data is stored in metric units internally. Display conversions happen at render time.

| Measurement | Metric | Imperial |
|---|---|---|
| Weight | kg | lb |
| Height | cm | ft/in |
| Food quantity | g | oz |
| Water | L | fl oz |

Unit preference is set per client by the consultant and can be overridden by the client in their portal.

---

## Roadmap

- [ ] Native mobile app (React Native)
- [ ] Photo food logging
- [ ] Payment integration for consultant subscriptions
- [ ] Client progress photos
- [ ] Multi-language support
- [ ] Group messaging / broadcast to all clients
- [ ] Appointment scheduling

---

## License

MIT License — feel free to use this project as a starting point for your own applications.

---

Built with ❤️ using Next.js, Firebase, and Claude AI.
