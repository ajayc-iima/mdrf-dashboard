# 🏔️ MDRF Dashboard

**Meghalaya Research Fellows — Work Tracking & Oversight Platform**

Built for MDRF (Meghalaya District Research Fellows) and MLRF (Meghalaya Legislative Research Fellows) programme management.

## Features

- 🔐 **Self-service signup** — anyone can create an account; new users start as guests pending admin approval
- 👑 **Admin approval flow** — the first person to sign up becomes admin; they approve others into roles
- 📝 **Work Logging** — Fellows log daily activities by category
- 📋 **Task Management** — Self-managed task tracking with status
- 🆘 **Support Requests** — Fellows flag issues, coordinators resolve
- 📊 **Analytics** — Charts, district breakdowns, activity trends
- 📥 **Export** — CSV/Excel with custom filters
- 🔔 **Alerts** — Silent fellows, stuck tasks, urgent requests
- 🏆 **Gamification** — Streaks and badges
- 📱 **Responsive** — Works on mobile and desktop

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full oversight, approve/reject accounts, assign roles, manage users |
| **Fellow** | Log work, manage tasks, raise support requests |
| **SRF** (Senior Research Fellow) | View fellow logs, basic filtering |
| **Data Scientist** | Full analytics, export, trends |
| **Coordinator** | Fellow oversight, alerts, support management |

## Access Flow

1. **First signup** → automatically becomes **Admin** (the very first account on the project).
2. **All subsequent signups** → land as **guests** with status `pending`. They see a "waiting for approval" screen.
3. **Admin** assigns each guest a role (Fellow / SRF / Data Scientist / Coordinator) and a district, then approves.
4. Approved users are routed to their role's dashboard on next sign-in.

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS + shadcn/ui
- **Database:** Firestore (Firebase)
- **Auth:** Firebase Auth (Email/Password)
- **Charts:** Recharts
- **Hosting:** Vercel

## Quick Start

### 1. Clone & Install

```bash
cd mdrf-dashboard
pnpm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or select existing)
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Go to Project Settings → Add Web App
6. Copy the config values

### 3. Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase config
```

### 4. Apply Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helpers
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      // Anyone signed in can read user profiles.
      allow read: if request.auth != null;
      // Users can create their own profile on signup.
      allow create: if request.auth.uid == userId;
      // Admins can update any profile; users can update their own (limited fields).
      allow update: if request.auth.uid == userId || isAdmin();
    }

    // Config (bootstrap flag)
    match /config/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Work logs
    match /workLogs/{logId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.fellowId;
      allow read: if request.auth != null;
    }

    // Tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }

    // Support requests
    match /supportRequests/{reqId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Register the first account** — it will automatically become the admin. Then invite others and approve them from the Admin → Approvals page.

### 6. Deploy to Vercel

```bash
pnpm i -g vercel
vercel
# Set env vars in Vercel dashboard → Settings → Environment Variables
```

## Project Structure

```
├── app/
│   ├── page.tsx                    # Login / Create Account
│   ├── pending/page.tsx            # Guest waiting screen
│   ├── admin/                      # Admin dashboard + user management
│   ├── fellow/                     # Fellow dashboard
│   ├── srf/                        # SRF dashboard
│   ├── datascientist/              # Data Scientist dashboard
│   └── coordinator/                # Coordinator dashboard
├── components/
│   ├── ui/                         # shadcn/ui components
│   └── layout/                     # Sidebar + DashboardLayout
├── lib/
│   ├── firebase.ts                # Firebase config
│   ├── firestore.ts                # Database helpers
│   ├── auth.ts                     # Auth helpers (sign in, sign up)
│   └── utils.ts                    # Utility functions
├── types/                          # TypeScript types
└── public/
    └── manifest.json               # PWA manifest
```

## License

Internal use — Government of Meghalaya & ISB Partnership
