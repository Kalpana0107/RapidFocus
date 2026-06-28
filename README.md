# ⚡ RapidFocus — AI-Powered Productivity Companion

<div align="center">

![RapidFocus Logo](https://img.shields.io/badge/RAPID-FOCUS-00D4FF?style=for-the-badge&labelColor=0A0F1E&color=00D4FF)

**PLAN SMART. FOCUS FAST. MISS NOTHING.**

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-Click%20Here-00D4FF?style=for-the-badge&logo=google-cloud&logoColor=white)](https://rapidfocus-564585755298.asia-southeast1.run.app)
[![Built With](https://img.shields.io/badge/Built%20With-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

*Built for Vibe2Ship Hackathon 2026 — Problem Statement 1: The Last-Minute Life Saver*

</div>

---

## 📌 What is RapidFocus?

RapidFocus is an **AI-powered productivity companion** that helps students, professionals, and entrepreneurs stop missing deadlines, build better habits, and stay focused — all in one beautiful dark-themed web app.

Unlike traditional to-do apps that just remind you, RapidFocus **proactively helps you take action** using Google's Gemini AI to prioritize tasks, schedule your day based on your mood, and coach you through completions.

---

## 🌐 Live App

👉 **[https://rapidfocus-564585755298.asia-southeast1.run.app](https://rapidfocus-564585755298.asia-southeast1.run.app)**

---

## ✨ Features

### 🧠 AI-Powered Core
| Feature | Description |
|---|---|
| **Smart Task Prioritization** | Gemini AI ranks your tasks using Eisenhower Matrix logic — Critical, High, Medium, Low |
| **Daily Briefing** | AI scans your tasks every morning and gives you a 3-bullet personalized briefing |
| **AI Scheduling Assistant** | Chat with your AI coach about tasks, time blocks, and productivity tips |
| **Mood-Based Scheduling** | Tell AI how you feel about each task → it schedules your day around your energy |

### ⏱️ Focus Timer
- **Stopwatch Mode** — track how long you spend on any task
- **Countdown Timer** — set a time limit and focus
- **Exam-Style Notifications** — alerts every 30 mins, special alerts at 20, 10, and 5 mins remaining
- **Beep sounds** via Web Audio API — just like an exam hall!

### 📊 Dashboard & Analytics
- **Urgency Meter** — see Late / Due Within 24H / On Track tasks at a glance
- **Overall Progress** — completion percentage across all tasks
- **Weekly Stats** — bar chart of tasks completed per day
- **On-Time vs Late** — donut chart of your completion quality
- **Peak Productivity Hours** — AI detects when you work best and schedules hard tasks then

### 🎯 Goals & Habits
- Add daily habits and long-term goals
- Track streaks with 🔥 fire emoji counter
- Mark habits complete daily to maintain streaks

### 🔔 Smart Reminders
- Browser push notifications even when you're on another tab
- Critical task alerts 2 hours before deadline
- Overdue task alerts

### 🎬 Cinematic Experience
- **Hotstar-style splash screen** on first load — logo zoom, letter-by-letter animation
- **Custom cyan cursor** with golden hover effect
- **Hover animations** — cards lift on hover throughout the app
- **Dark navy theme** with teal/cyan accents

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + TypeScript | UI components and pages |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | Node.js + Express | API server and Gemini AI calls |
| **Database** | Firebase Firestore | Real-time data storage |
| **Auth** | Firebase Auth | Google Sign-In + Email/Password |
| **AI** | Gemini 2.0 Flash | Prioritization, chat, scheduling |
| **Charts** | Recharts | Analytics and stats visualization |
| **Icons** | Lucide React | Clean icon library |
| **Deploy** | Google Cloud Run | Live hosting and auto-scaling |
| **Build** | Vite | Fast frontend bundler |

---

## 📁 Project Structure

```
RapidFocus/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── Components/              # UI Components
│   │   │   ├── Sidebar.tsx          # Navigation + logout
│   │   │   ├── TaskCard.tsx         # Individual task display
│   │   │   ├── AddTaskModal.tsx     # Add task form with mood picker
│   │   │   ├── UrgencyMeter.tsx     # Late/Due Soon/On Track meter
│   │   │   ├── DailyBriefing.tsx    # AI daily briefing banner
│   │   │   ├── FocusTimer.tsx       # Stopwatch + countdown timer
│   │   │   ├── ChatPanel.tsx        # AI chat assistant panel
│   │   │   ├── GoalsTab.tsx         # Goals and habits tracker
│   │   │   ├── StatsTab.tsx         # Analytics and charts
│   │   │   └── SplashScreen.tsx     # Hotstar-style intro animation
│   │   ├── hooks/
│   │   │   └── useAuth.ts           # Firebase auth hook
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login page
│   │   │   └── Dashboard.tsx        # Main dashboard
│   │   ├── services/
│   │   │   ├── firebase.ts          # Firebase config
│   │   │   ├── taskService.ts       # Firestore CRUD operations
│   │   │   └── geminiService.ts     # Gemini API calls
│   │   └── App.tsx                  # Root component + routing
├── server/
│   └── server.ts                    # Express server + all API routes
├── Dockerfile                       # Cloud Run deployment config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Firebase project
- A Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### 1. Clone the repository
```bash
git clone https://github.com/Kalpana0107/RapidFocus.git
cd RapidFocus
```

### 2. Setup Frontend
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

### 3. Setup Backend
```bash
cd ../server
npm install
```

Create `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

### 4. Run the app

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npx ts-node server.ts
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 🔥 How AI Works in RapidFocus

### 1. Task Prioritization
```
User adds task
      ↓
All tasks sent to Gemini 2.0 Flash
      ↓
Gemini ranks using Eisenhower Matrix
      ↓
Returns: priorityScore (1-10), label, reasoning
      ↓
Badges appear on task cards instantly
```

### 2. Mood-Based Scheduling
```
User clicks AI Schedule
      ↓
Quiz asks mood for each task
(😄 Excited / 🙂 Good / 😐 Neutral / 😩 Tired / 😰 Anxious)
      ↓
User enters free time slots ("9am-11am, 3pm-6pm")
      ↓
Gemini generates hour-by-hour schedule
      ↓
Excited tasks scheduled first
Tired tasks get shorter blocks with breaks
```

### 3. Exam-Style Timer Notifications
```
User sets 2 hour timer for assignment
      ↓
⏰ At 90 mins remaining  → "90 minutes remaining — keep going!"
⏰ At 60 mins remaining  → "1 hour remaining — stay focused!"
🔔 At 30 mins remaining  → "Only 30 minutes left!"
⚡ At 20 mins remaining  → "20 minutes left — wrap up!"
🚨 At 10 mins remaining  → "Only 10 minutes left!"
🚨 At 5 mins remaining   → "5 minutes! Finish now!"
🎯 At 0                  → "Time's up!"
```

---

## 📱 Screenshots

| Screen | Description |
|---|---|
| **Splash Screen** | Hotstar-style cinematic intro on app load |
| **Login Page** | Google Sign-In + Email/Password auth |
| **Dashboard** | Urgency meter + task list + daily AI briefing |
| **Focus Timer** | Stopwatch and countdown with exam notifications |
| **AI Chat** | Conversational AI coach with task context |
| **Goals & Habits** | Streak tracker with fire emoji |
| **Stats** | Weekly charts + peak productivity hours |

---

## 🧠 AI Features Summary

- ✅ Intelligent task prioritization (Eisenhower Matrix)
- ✅ AI-powered scheduling based on mood and free time
- ✅ Personalized daily briefing every morning
- ✅ Conversational AI coach (context-aware chat)
- ✅ Context-aware reminders (due soon, overdue alerts)
- ✅ Best time predictor from completion patterns
- ✅ Weekly AI productivity insights

---

## 🏆 Hackathon Details

| Field | Details |
|---|---|
| **Event** | Vibe2Ship Hackathon 2026 |
| **Problem Statement** | PS1 — The Last-Minute Life Saver |
| **Timeline** | 22nd June 3PM — 29th June 2PM |
| **Core Tool** | Google AI Studio + Gemini API |
| **Deployed** | Google Cloud Run |

---
## 💙 Special Thanks

We would like to acknowledge the following tools and communities that contributed to the development of this project:

- **Google AI Studio** for access to the Gemini 1.5 Flash Vision model.
- **Firebase** for handling authentication and cloud-based data storage.
- **Coding Ninjas** in collaboration with **Google for Developers** for providing the Vibe2Ship Hackathon platform

## 👩💻 Built By

**Kalpana Naikodi**
- 🎓 B.Tech AI & Data Science — VESIT Mumbai (2025-2029)
- 💼 Full-stack developer | AI enthusiast
- 🐙 GitHub: [@Kalpana0107](https://github.com/Kalpana0107)

---

## 📄 License

This project was built for the Vibe2Ship Hackathon 2026.
Feel free to use it as a reference for learning purposes.

---

<div align="center">

**⚡ RapidFocus — Because deadlines wait for no one.**

Made with 💙 using Google AI Studio + Gemini API

</div>
