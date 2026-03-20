/**
 * NexOS Seed Script — populates a demo user with sample data
 * Run: node backend/seed.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexos';

// ── Inline schemas (mirrors models) ───────────────────────────────
const userSchema = new mongoose.Schema({
  name: String, email: String, password: String,
  xp: { type: Number, default: 0 }, level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 }, lastActiveDate: Date,
  achievements: [String], memory: [{ type: String, content: String, createdAt: Date }],
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, title: String,
  priority: String, category: String, status: String,
  dueDate: Date, completedAt: Date, xpReward: Number,
}, { timestamps: true });

const goalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, title: String,
  description: String, category: String, targetDate: Date,
  milestones: [{
    title: String, description: String, timeframe: String,
    status: { type: String, default: 'pending' }, completedAt: Date,
  }],
  progress: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  color: String, aiGenerated: Boolean,
}, { timestamps: true });

const habitSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, name: String,
  emoji: String, category: String, frequency: String,
  streak: Number, longestStreak: Number,
  completions: [{ date: Date, note: String }],
  color: String, xpReward: Number, isActive: Boolean,
}, { timestamps: true });

const moodSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  emoji: String, label: String, score: Number, note: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Goal = mongoose.model('Goal', goalSchema);
const Habit = mongoose.model('Habit', habitSchema);
const Mood = mongoose.model('Mood', moodSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing demo user
  const existing = await User.findOne({ email: 'demo@nexos.app' });
  if (existing) {
    await Promise.all([
      Task.deleteMany({ userId: existing._id }),
      Goal.deleteMany({ userId: existing._id }),
      Habit.deleteMany({ userId: existing._id }),
      Mood.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
    console.log('🗑  Cleared old demo data');
  }

  // Create demo user
  const password = await bcrypt.hash('demo1234', 12);
  const user = await User.create({
    name: 'Alex Chen',
    email: 'demo@nexos.app',
    password,
    xp: 3420,
    level: 7,
    streak: 5,
    lastActiveDate: new Date(),
    achievements: ['first_task', 'task_10', 'streak_3', 'first_goal', 'first_habit', 'level_5'],
  });
  const uid = user._id;
  console.log('👤 Created demo user: demo@nexos.app / demo1234');

  // Tasks
  const today = new Date();
  await Task.insertMany([
    { userId: uid, title: 'Review pull requests (3 pending)', priority: 'high', category: 'Work', status: 'todo', xpReward: 30 },
    { userId: uid, title: 'Complete React component library', priority: 'high', category: 'Work', status: 'done', completedAt: today, xpReward: 30 },
    { userId: uid, title: '30-minute Python practice', priority: 'medium', category: 'Study', status: 'done', completedAt: today, xpReward: 20 },
    { userId: uid, title: 'Read 20 pages of Atomic Habits', priority: 'medium', category: 'Growth', status: 'todo', xpReward: 20 },
    { userId: uid, title: 'Evening workout', priority: 'medium', category: 'Health', status: 'done', completedAt: today, xpReward: 20 },
    { userId: uid, title: 'Drink 8 glasses of water', priority: 'low', category: 'Health', status: 'done', completedAt: today, xpReward: 10 },
    { userId: uid, title: 'Plan tomorrow\'s schedule', priority: 'medium', category: 'Planning', status: 'todo', xpReward: 20 },
    { userId: uid, title: 'Write weekly newsletter draft', priority: 'medium', category: 'Work', status: 'todo', dueDate: new Date(Date.now() + 86400000), xpReward: 20 },
  ]);
  console.log('✅ Seeded tasks');

  // Goals
  await Goal.insertMany([
    {
      userId: uid, title: 'Learn Python in 3 months',
      description: 'Master Python from basics to building real projects',
      category: 'Learning', color: 'purple', aiGenerated: true,
      targetDate: new Date(Date.now() + 90 * 86400000),
      progress: 34,
      milestones: [
        { title: 'Basics: Variables, loops, functions', description: 'Core syntax and programming fundamentals', timeframe: 'Week 1-3', status: 'done', completedAt: new Date(Date.now() - 20 * 86400000) },
        { title: 'OOP & data structures', description: 'Classes, lists, dicts, sets, and algorithms', timeframe: 'Week 4-6', status: 'active' },
        { title: 'File handling & APIs', description: 'Read/write files, call REST APIs with requests', timeframe: 'Week 7-9', status: 'pending' },
        { title: 'Mini projects & practice', description: 'Build 3 real projects to cement knowledge', timeframe: 'Week 10-12', status: 'pending' },
      ],
    },
    {
      userId: uid, title: 'Build a full-stack SaaS app',
      description: 'From idea to deployed product with paying users',
      category: 'Career', color: 'teal', aiGenerated: false,
      targetDate: new Date(Date.now() + 120 * 86400000),
      progress: 18,
      milestones: [
        { title: 'Design system & wireframes', description: 'Figma mockups for all key screens', timeframe: 'Week 1-2', status: 'done', completedAt: new Date(Date.now() - 10 * 86400000) },
        { title: 'Backend API with Node.js', description: 'Auth, CRUD, payments, tests', timeframe: 'Week 3-5', status: 'active' },
        { title: 'Frontend React dashboard', description: 'Connect all API endpoints, polish UI', timeframe: 'Week 6-8', status: 'pending' },
        { title: 'Auth, payments, deploy', description: 'Stripe integration, deploy to production', timeframe: 'Week 9-12', status: 'pending' },
      ],
    },
    {
      userId: uid, title: 'Run a 5K in under 25 minutes',
      description: 'Build cardiovascular fitness and hit my target time',
      category: 'Health', color: 'amber', aiGenerated: true,
      targetDate: new Date(Date.now() + 60 * 86400000),
      progress: 55,
      milestones: [
        { title: 'Build base cardio (3x/week)', description: 'Easy 20-30 min runs, build habit', timeframe: 'Month 1', status: 'done', completedAt: new Date(Date.now() - 5 * 86400000) },
        { title: 'Interval training program', description: 'Speed work to improve pace', timeframe: 'Month 2', status: 'active' },
        { title: 'Race day preparation', description: 'Taper, rest, and compete', timeframe: 'Month 3', status: 'pending' },
      ],
    },
  ]);
  console.log('✅ Seeded goals');

  // Habits
  const daysBack = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  await Habit.insertMany([
    {
      userId: uid, name: 'Morning workout', emoji: '💪', category: 'Fitness',
      frequency: 'daily', streak: 5, longestStreak: 12, color: 'purple', xpReward: 15,
      isActive: true,
      completions: [0,1,2,3,4].map(n => ({ date: daysBack(n), note: '' })),
    },
    {
      userId: uid, name: 'Read 30 min', emoji: '📖', category: 'Learning',
      frequency: 'daily', streak: 4, longestStreak: 8, color: 'teal', xpReward: 15,
      isActive: true,
      completions: [0,1,2,4].map(n => ({ date: daysBack(n), note: '' })),
    },
    {
      userId: uid, name: 'Meditate', emoji: '🧘', category: 'Mindfulness',
      frequency: 'daily', streak: 3, longestStreak: 6, color: 'green', xpReward: 15,
      isActive: true,
      completions: [0,1,2].map(n => ({ date: daysBack(n), note: '' })),
    },
    {
      userId: uid, name: 'No sugar', emoji: '🥗', category: 'Nutrition',
      frequency: 'daily', streak: 2, longestStreak: 5, color: 'amber', xpReward: 20,
      isActive: true,
      completions: [0,1].map(n => ({ date: daysBack(n), note: '' })),
    },
    {
      userId: uid, name: 'Drink 3L water', emoji: '💧', category: 'Health',
      frequency: 'daily', streak: 6, longestStreak: 14, color: 'teal', xpReward: 10,
      isActive: true,
      completions: [0,1,2,3,4,5].map(n => ({ date: daysBack(n), note: '' })),
    },
  ]);
  console.log('✅ Seeded habits');

  // Moods
  const moodData = [
    { score: 4, emoji: '😊', label: 'Good', note: 'Productive morning session', daysAgo: 0 },
    { score: 5, emoji: '😄', label: 'Excellent', note: 'Finished the React component library!', daysAgo: 1 },
    { score: 3, emoji: '😐', label: 'Neutral', note: 'Tired from late-night coding', daysAgo: 2 },
    { score: 4, emoji: '😊', label: 'Good', note: 'Great workout today', daysAgo: 3 },
    { score: 2, emoji: '😔', label: 'Low', note: 'Stressed about deadlines', daysAgo: 4 },
    { score: 5, emoji: '😄', label: 'Excellent', note: 'Shipped the new feature!', daysAgo: 5 },
    { score: 4, emoji: '😊', label: 'Good', note: '', daysAgo: 6 },
  ];
  await Mood.insertMany(moodData.map(m => {
    const d = new Date(); d.setDate(d.getDate() - m.daysAgo);
    return { userId: uid, emoji: m.emoji, label: m.label, score: m.score, note: m.note, createdAt: d };
  }));
  console.log('✅ Seeded moods');

  console.log('\n🎉 Seed complete!');
  console.log('   Login: demo@nexos.app');
  console.log('   Password: demo1234\n');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
