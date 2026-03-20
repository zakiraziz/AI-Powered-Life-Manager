import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, CardTitle, ProgressBar, Badge } from '../components/UI';

const ALL_ACHIEVEMENTS = [
  { id: 'first_task', icon: '✅', name: 'First Step', desc: 'Complete your first task', xp: 50, unlock: (u, stats) => stats.totalTasksDone >= 1 },
  { id: 'task_10', icon: '🎯', name: 'Task Crusher', desc: 'Complete 10 tasks', xp: 100, unlock: (u, stats) => stats.totalTasksDone >= 10 },
  { id: 'task_50', icon: '⚡', name: 'Productivity Beast', desc: 'Complete 50 tasks', xp: 300, unlock: (u, stats) => stats.totalTasksDone >= 50 },
  { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: '3-day login streak', xp: 75, unlock: (u) => u.streak >= 3 },
  { id: 'streak_7', icon: '🌟', name: 'Week Warrior', desc: '7-day streak', xp: 200, unlock: (u) => u.streak >= 7 },
  { id: 'streak_30', icon: '💎', name: 'Diamond Streak', desc: '30-day streak', xp: 1000, unlock: (u) => u.streak >= 30 },
  { id: 'first_goal', icon: '🗺️', name: 'Visionary', desc: 'Create your first goal', xp: 50, unlock: (u, stats) => stats.totalGoals >= 1 },
  { id: 'goal_ai', icon: '🤖', name: 'AI Planner', desc: 'Generate an AI roadmap', xp: 100, unlock: (u, stats) => stats.aiGoals >= 1 },
  { id: 'goal_complete', icon: '🏆', name: 'Goal Crusher', desc: 'Complete a full goal', xp: 500, unlock: (u, stats) => stats.completedGoals >= 1 },
  { id: 'first_habit', icon: '⚙️', name: 'System Builder', desc: 'Add your first habit', xp: 50, unlock: (u, stats) => stats.totalHabits >= 1 },
  { id: 'habit_streak_7', icon: '📅', name: 'Consistent', desc: 'Complete a habit 7 days in a row', xp: 200, unlock: (u, stats) => stats.longestHabitStreak >= 7 },
  { id: 'level_5', icon: '🆙', name: 'Rising Star', desc: 'Reach Level 5', xp: 250, unlock: (u) => u.level >= 5 },
  { id: 'level_10', icon: '🌙', name: 'NexOS Master', desc: 'Reach Level 10', xp: 750, unlock: (u) => u.level >= 10 },
  { id: 'xp_1000', icon: '💡', name: 'Knowledge Seeker', desc: 'Earn 1,000 XP total', xp: 100, unlock: (u) => u.xp >= 1000 },
  { id: 'jarvis_10', icon: '🧠', name: 'AI Whisperer', desc: 'Have 10+ conversations with Jarvis', xp: 150, unlock: (u, stats) => stats.jarvisSessions >= 10 },
  { id: 'mood_7', icon: '❤️', name: 'Self Aware', desc: 'Log mood 7 days in a row', xp: 150, unlock: (u, stats) => stats.moodStreak >= 7 },
];

function AchievementItem({ ach, unlocked }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 'var(--r2)',
      background: 'var(--bg4)', marginBottom: 8,
      border: `1px solid ${unlocked ? 'var(--border2)' : 'var(--border)'}`,
      opacity: unlocked ? 1 : 0.45,
      transition: 'all 0.15s',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: unlocked ? 'var(--purple-dim2)' : 'var(--bg5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: unlocked ? 22 : 18,
      }}>
        {unlocked ? ach.icon : '🔒'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{ach.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{ach.desc}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', whiteSpace: 'nowrap' }}>
        +{ach.xp} XP
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { user } = useAuth();

  // Dummy stats — in production, fetch from backend
  const stats = {
    totalTasksDone: 12, totalGoals: 2, aiGoals: 1, completedGoals: 0,
    totalHabits: 3, longestHabitStreak: 5, jarvisSessions: 4,
    moodStreak: 2,
  };

  const unlocked = ALL_ACHIEVEMENTS.filter(a => user && a.unlock(user, stats));
  const locked = ALL_ACHIEVEMENTS.filter(a => !user || !a.unlock(user, stats));
  const totalXP = unlocked.reduce((s, a) => s + a.xp, 0);
  const pct = Math.round((unlocked.length / ALL_ACHIEVEMENTS.length) * 100);

  return (
    <div style={{ padding: 28 }}>
      <PageHeader title="◆ Achievements" subtitle={`${unlocked.length}/${ALL_ACHIEVEMENTS.length} unlocked · ${totalXP} XP earned`} />

      {/* Progress overview */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--purple2)' }}>
              {unlocked.length} <span style={{ fontSize: 16, color: 'var(--text3)' }}>/ {ALL_ACHIEVEMENTS.length}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>achievements unlocked</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--amber)' }}>{pct}%</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>completion</div>
          </div>
        </div>
        <ProgressBar value={pct} color="purple" height={8} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <CardTitle>Unlocked 🏆</CardTitle>
          {unlocked.length ? unlocked.map(a => <AchievementItem key={a.id} ach={a} unlocked={true} />)
            : <div style={{ color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>Complete tasks and build habits to unlock achievements!</div>}
        </div>
        <div>
          <CardTitle>Locked — Keep Going</CardTitle>
          {locked.map(a => <AchievementItem key={a.id} ach={a} unlocked={false} />)}
        </div>
      </div>
    </div>
  );
}
