# 🥗 Nutrition Consultant App

A full-stack web application that connects nutrition consultants with their clients. Consultants can build AI-powered meal plans, track client progress, and send daily reports. Clients can view their plans, log daily health data, and monitor their progress.

**Live Demo:** [nutrition-consultant-app.vercel.app](https://nutrition-consultant-app.vercel.app)

---

## Features

### 👩‍⚕️ Consultant Portal
- **Client Management** — Add and manage clients with personal info, health goals, and clinical notes
- **AI Meal Plan Generator** — Generate a full day-by-day meal plan using Claude AI based on the client's program goal (weight loss, muscle gain, diabetes management, heart health, sports performance, gut health, or custom)
- **Meals Builder** — Edit any AI-generated meal using a food search powered by Open Food Facts (3M+ foods)
- **Calorie Calculator** — Standalone calculator to search foods, adjust serving sizes, and calculate meal totals
- **Action Plans** — Create plans with tasks (exercise, hydration, lifestyle), weight goals, and start/end dates
- **Reports** — View all client daily logs in one place
- **Email Reports** — Send or resend daily summary reports to client logs via email
- **Profile** — Edit consultant bio, credentials, specializations, phone, and email

### 📱 Client Portal
- **My Plan** — View the full day-by-day meal plan with ingredients and calories, plus two progress bars: program day countdown and task completion
- **Log Today** — Daily logging: water intake, weight (optional), mood, symptoms, exercise, meals experience, bowel movement, night sleep, and additional notes
- **My Stats** — Charts for water intake, weight, and mood trends over time
- **History** — View all past logs and resend email reports
- **My Consultant** — View consultant's public profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| AI Meal Plans | Anthropic Claude API (claude-opus-4-6) |
| Food Database | Open Food Facts API (free, no key required) |
| Email | Nodemailer + Gmail |
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
│   ├── consultant/          # Consultant portal pages
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── action-plans/
│   │   ├── calculator/
│   │   ├── reports/
│   │   └── profile/
│   ├── client/              # Client portal pages
│   │   ├── dashboard/
│   │   ├── log/
│   │   ├── plan/
│   │   ├── stats/
│   │   ├── history/
│   │   └── consultant/
│   └── api/                 # API routes
│       ├── generate-meal-plan/
│       ├── send-report/
│       ├── send-reminder/
│       ├── update-client-email/
│       └── update-consultant-email/
├── components/
│   ├── consultant/          # Consultant-specific components
│   │   ├── Sidebar.tsx
│   │   ├── CalorieCalculator.tsx
│   │   └── MealsBuilder.tsx
│   ├── client/              # Client-specific components
│   │   └── ClientSidebar.tsx
│   └── ui/                  # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── LoadingSpinner.tsx
├── context/
│   └── AuthContext.tsx      # Firebase auth context
└── lib/
    ├── firebase.ts          # Firebase client config
    ├── firebase-admin.ts    # Firebase Admin SDK
    ├── firestore.ts         # Firestore helper functions
    ├── email.ts             # Email template builder
    └── types.ts             # TypeScript interfaces
```

---

## Key Data Models

### ActionPlan
```typescript
{
  consultantId, clientId, clientName,
  title, programGoal, status,
  startDate, nextConsultation,
  startWeight, targetWeight,
  planDays: PlanDay[],   // AI-generated day-by-day meals
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

## Firestore Security Rules

```
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
  }
}
```

---

## Roadmap

- [ ] Native mobile app (React Native)
- [ ] In-app messaging between consultant and client
- [ ] Photo food logging
- [ ] Payment integration for consultant subscriptions
- [ ] Client progress photos
- [ ] PDF export of action plans
- [ ] Multi-language support

---

## License

MIT License — feel free to use this project as a starting point for your own applications.

---

Built with ❤️ using Next.js, Firebase, and Claude AI.
