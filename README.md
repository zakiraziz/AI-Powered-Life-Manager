# NexOS — Personal Operating System

A full-stack AI-powered life management system. Your second brain.

---

## 🗂 Project Structure

```
nexos/
├── backend/                  # Node.js + Express API
│   ├── models/               # MongoDB schemas
│   │   ├── User.js           # User, XP, levels, streaks, AI memory
│   │   ├── Task.js           # Tasks with priority, category, XP rewards
│   │   ├── Goal.js           # Goals with AI-generated milestones
│   │   ├── Habit.js          # Habit tracker with streak logic
│   │   └── Mood.js           # Mood logging with scores
│   ├── routes/               # REST API routes
│   │   ├── auth.js           # Register, login, JWT auth
│   │   ├── tasks.js          # Full CRUD + XP on completion
│   │   ├── goals.js          # Goals + AI roadmap generation
│   │   ├── habits.js         # Habit completion + streak calc
│   │   ├── mood.js           # Mood log + weekly stats
│   │   ├── ai.js             # Jarvis chat, daily plan, analysis
│   │   └── dashboard.js      # Aggregated dashboard data
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── server.js             # Express app + MongoDB connection
│   └── .env.example          # Environment variables template
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx   # Overview, stats, charts
│   │   │   ├── JarvisPage.jsx      # AI chat + daily plan
│   │   │   ├── TasksPage.jsx       # Task management
│   │   │   ├── GoalsPage.jsx       # Goals + AI roadmap
│   │   │   ├── HabitsPage.jsx      # Habit tracker
│   │   │   ├── MoodPage.jsx        # Mood logging + chart
│   │   │   ├── AchievementsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Sidebar + nav
│   │   │   └── UI.jsx              # Reusable components
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── utils/
│   │   │   └── api.js              # Axios client with JWT
│   │   ├── styles/
│   │   │   └── globals.css         # Design system + CSS vars
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── package.json              # Root workspace config
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) — free tier)
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### 2. Clone and Install

```bash
git clone <your-repo>
cd nexos

# Install all dependencies
npm install
npm install --workspace=frontend
npm install --workspace=backend
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexos
JWT_SECRET=your_super_secret_key_change_this
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
```

### 4. Run Development

```bash
# From root — runs both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🚀 Features

### ✦ Jarvis AI
- Full chat interface backed by Claude claude-opus-4-5
- Context-aware: knows your tasks, goals, habits, mood
- Daily plan generator
- Productivity analysis
- Memory system: stores conversation patterns

### 📊 Smart Dashboard
- Real-time stats: tasks, XP, streak, goals
- Weekly XP bar chart (Recharts)
- Today's task list + goal progress

### 🧩 Auto Planning (AI Roadmap)
- Enter any goal → Jarvis generates 4-milestone roadmap
- Timeframes, descriptions, sequential activation
- Progress tracked automatically

### ✅ Task Management
- Priority levels with XP rewards (High: 30, Med: 20, Low: 10)
- Categories, due dates, status tracking
- Filters: All / To Do / Done / High Priority

### ◉ Habit Tracker
- 7-day grid visualization
- Automatic streak calculation
- Undo support for same-day completions
- Category + frequency settings

### ◐ Mood Log
- 5-level mood scoring
- Weekly average with trend chart
- Note support

### ◆ Achievements
- 16 unlockable achievements
- XP rewards per achievement
- Progress bar overview

### 🎮 Gamification
- XP earned for every action
- Level system (500 XP per level)
- Login streaks
- Achievement unlocks

---

## 🌐 Production Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Set environment variables in your hosting dashboard
# Deploy backend/ directory
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ directory
# Set VITE_API_URL env var to your backend URL
```

### MongoDB Atlas
1. Create free cluster at cloud.mongodb.com
2. Get connection string
3. Set as MONGODB_URI in backend .env

---

## 🔮 Extending NexOS

### Add Voice Input (Jarvis)
```jsx
// Use Web Speech API in JarvisPage.jsx
const recognition = new window.SpeechRecognition();
recognition.onresult = e => setInput(e.results[0][0].transcript);
```

### Add Push Notifications
- Use [web-push](https://github.com/web-push-libs/web-push) in backend
- Schedule daily reminders with node-cron

### Add Chrome Extension
- Create `manifest.json` pointing to your API
- Quick-add tasks from any webpage

### Add Email Reminders (Nodemailer)
```bash
npm install nodemailer --workspace=backend
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | CSS Modules + CSS Variables |
| Charts | Recharts |
| Icons | React Icons |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| AI | Anthropic Claude (claude-opus-4-5) |
| Notifications | react-hot-toast |

---

Built with ❤️ — NexOS v1.0.0
